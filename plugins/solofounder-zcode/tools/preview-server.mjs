#!/usr/bin/env node
/**
 * SoloFounder static preview helper for ZCode.
 * Security properties:
 * - Loopback-only listener (127.0.0.1); no host override is accepted.
 * - Serves only direct-child .html files from an explicit directory.
 * - GET/HEAD only; no writes, WebSockets, event ingestion or process control.
 * - Refuses symlinks and files larger than 2 MiB.
 * - Strict CSP disables JavaScript and remote resources.
 * - Foreground process; Ctrl+C stops it. No PID files or recursive deletion.
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const HOST = '127.0.0.1';

function parseArgs(argv) {
  let dir = '';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dir') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --dir');
      dir = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node preview-server.mjs --dir <preview-directory>');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!dir) throw new Error('Required: --dir <preview-directory>');
  return path.resolve(dir);
}

function send(req, res, status, body, extraHeaders = {}) {
  const data = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'off',
    'Content-Security-Policy': "default-src 'none'; script-src 'none'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    ...extraHeaders,
  });
  if (req.method === 'HEAD') res.end();
  else res.end(data);
}

async function main() {
  const requestedDir = parseArgs(process.argv.slice(2));
  const root = await fs.realpath(requestedDir);
  const rootStat = await fs.stat(root);
  if (!rootStat.isDirectory()) throw new Error('--dir must point to a directory');

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(req, res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
        return;
      }

      const address = server.address();
      const expectedHosts = new Set([`127.0.0.1:${address.port}`, `localhost:${address.port}`]);
      const hostHeader = String(req.headers.host || '').toLowerCase();
      if (!expectedHosts.has(hostHeader)) {
        send(req, res, 403, 'Invalid Host header');
        return;
      }

      const requestTarget = String(req.url || '/');
      if (!requestTarget.startsWith('/') || requestTarget.startsWith('//')) { send(req, res, 400, 'Bad request'); return; }
      const rawPath = requestTarget.split('?')[0];
      let decoded;
      try { decoded = decodeURIComponent(rawPath); }
      catch { send(req, res, 400, 'Bad request'); return; }

      const fileName = decoded === '/' ? 'index.html' : decoded.slice(1);
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.(html|png|jpe?g|webp|gif)$/i.test(fileName) || fileName.includes('..')) {
        send(req, res, 404, 'Not found');
        return;
      }

      const candidate = path.join(root, fileName);
      if (path.dirname(candidate) !== root) {
        send(req, res, 404, 'Not found');
        return;
      }

      let handle;
      try {
        // Open the final path without following a symlink where the platform supports O_NOFOLLOW.
        const flags = fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0);
        handle = await fs.open(candidate, flags);
      } catch (err) {
        if (err && ['ENOENT', 'ELOOP', 'ENOTDIR'].includes(err.code)) { send(req, res, 404, 'Not found'); return; }
        throw err;
      }
      try {
        const st = await handle.stat();
        if (!st.isFile()) { send(req, res, 404, 'Not found'); return; }
        if (st.size > MAX_FILE_BYTES) { send(req, res, 413, 'Preview file exceeds 2 MiB limit'); return; }
        const real = await fs.realpath(candidate);
        if (path.dirname(real) !== root) { send(req, res, 404, 'Not found'); return; }
        const ext = path.extname(real).toLowerCase();
        const mime = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }[ext];
        if (!mime) { send(req, res, 404, 'Not found'); return; }
        const html = await handle.readFile();
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': html.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'X-DNS-Prefetch-Control': 'off',
        'Content-Security-Policy': "default-src 'none'; script-src 'none'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      });
        if (req.method === 'HEAD') res.end();
        else res.end(html);
      } finally {
        await handle.close().catch(() => {});
      }
    } catch (err) {
      console.error('Preview request failed:', err?.message || String(err));
      if (!res.headersSent) send(req, res, 500, 'Internal server error');
      else res.destroy();
    }
  });

  server.requestTimeout = 10_000;
  server.headersTimeout = 5_000;
  server.keepAliveTimeout = 2_000;
  server.maxHeadersCount = 50;

  server.listen(0, HOST, () => {
    const address = server.address();
    console.log(`Preview available at http://localhost:${address.port}/`);
    console.log(`Serving static HTML from: ${root}`);
    console.log('Security: loopback only; JavaScript and remote resources blocked; Ctrl+C to stop.');
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(`Preview server could not start: ${err.message}`);
  process.exitCode = 1;
});
