#!/usr/bin/env python3
"""Smoke/security test for the optional Node localhost preview server."""
from pathlib import Path
import tempfile, subprocess, urllib.request, urllib.error, re, signal, sys, time
ROOT=Path(__file__).resolve().parents[1]
SERVER=ROOT/'plugins'/'solofounder-zcode'/'tools'/'preview-server.mjs'
with tempfile.TemporaryDirectory() as tmp:
    d=Path(tmp)
    d.joinpath('index.html').write_text('<!doctype html><title>preview-test</title><h1>OK</h1><script>window.pwned=true</script>',encoding='utf-8')
    d.joinpath('pixel.png').write_bytes(bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082'))
    d.joinpath('large.html').write_text('x' * (2 * 1024 * 1024 + 1), encoding='utf-8')
    outside=Path(tmp).parent/'preview-outside-secret.html'
    outside.write_text('OUTSIDE', encoding='utf-8')
    symlink_ok=True
    try: d.joinpath('link.html').symlink_to(outside)
    except (OSError, NotImplementedError): symlink_ok=False
    proc=subprocess.Popen(['node',str(SERVER),'--dir',str(d)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        first=proc.stdout.readline().strip()
        match=re.search(r'http://localhost:(\d+)/',first)
        assert match, f'preview server did not start: {first}'
        port=int(match.group(1)); base=f'http://localhost:{port}'
        def call(path='/',method='GET',host=None):
            req=urllib.request.Request(base+path,method=method,headers={'Host':host or f'localhost:{port}'})
            return urllib.request.urlopen(req,timeout=3)
        with call() as response:
            body=response.read().decode('utf-8')
            assert response.status==200 and '<h1>OK</h1>' in body
            csp=response.headers.get('Content-Security-Policy','')
            assert "script-src 'none'" in csp and "connect-src 'none'" in csp
        with call('/pixel.png') as response:
            assert response.status==200 and response.headers.get_content_type()=='image/png'
        try: call('/large.html')
        except urllib.error.HTTPError as exc: assert exc.code==413
        else: raise AssertionError('oversized file accepted')
        if symlink_ok:
            try: call('/link.html')
            except urllib.error.HTTPError as exc: assert exc.code==404
            else: raise AssertionError('symlink accepted')
        with call(method='HEAD') as response:
            assert response.status==200 and response.read()==b''
        for path, expected in [('/%2e%2e/secret.html',404),('/%ZZ',400)]:
            try: call(path)
            except urllib.error.HTTPError as exc: assert exc.code==expected,(path,exc.code)
            else: raise AssertionError(f'accepted unsafe path: {path}')
        try: call(method='POST')
        except urllib.error.HTTPError as exc: assert exc.code==405
        else: raise AssertionError('POST accepted')
        try: call(host=f'not-local.example:{port}')
        except urllib.error.HTTPError as exc: assert exc.code==403
        else: raise AssertionError('invalid Host accepted')
        print('PASS: HTML, raster, HEAD, traversal rejection, malformed URI rejection, POST rejection, Host validation, symlink rejection, size limit, CSP.')
    finally:
        try: outside.unlink(missing_ok=True)
        except Exception: pass
        if proc.poll() is None:
            proc.send_signal(signal.SIGTERM)
            try: proc.wait(timeout=3)
            except subprocess.TimeoutExpired: proc.kill(); proc.wait()
