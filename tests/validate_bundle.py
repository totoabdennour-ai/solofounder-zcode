from pathlib import Path
import json, re, sys
ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'plugins' / 'solofounder-zcode'
errors=[]
def fail(msg): errors.append(msg)
manifest=json.loads((PLUGIN/'.zcode-plugin/plugin.json').read_text(encoding='utf-8'))
market=json.loads((ROOT/'marketplace.json').read_text(encoding='utf-8'))
entry=next((p for p in market['plugins'] if p['name']==manifest['name']),None)
if not entry: fail('Marketplace entry missing')
elif entry.get('version') != manifest.get('version'): fail('Marketplace/plugin version mismatch')
elif entry.get('description') != manifest.get('description'): fail('Marketplace/plugin description mismatch')
if manifest.get('commands')!='commands' or manifest.get('skills')!='skills' or manifest.get('agents')!='agents': fail('Plugin component directories are not registered')
skills=list((PLUGIN/'skills').glob('*/SKILL.md'))
if len(skills)!=10: fail(f'Expected 10 skills, found {len(skills)}')
for f in skills:
    raw=f.read_text(encoding='utf-8')
    m=re.match(r'^---\n(.*?)\n---\n',raw,re.S)
    if not m or not re.search(r'^name:\s*\S+',m.group(1),re.M) or not re.search(r'^description:\s*\S+',m.group(1),re.M): fail(f'Invalid skill frontmatter: {f}')
    desc=re.search(r'^description:\s*(.*)$',m.group(1),re.M)
    if desc and len(desc.group(1))>1024: fail(f'Skill description over 1024 chars: {f}')
agents=list((PLUGIN/'agents').glob('*.md'))
if len(agents)<5: fail('Expected at least five registered subagents')
for f in agents:
    raw=f.read_text(encoding='utf-8')
    m=re.match(r'^---\n(.*?)\n---\n',raw,re.S)
    if not m or not re.search(r'^name:\s*\S+',m.group(1),re.M) or not re.search(r'^description:\s*\S+',m.group(1),re.M): fail(f'Invalid agent frontmatter: {f}')
if (PLUGIN/'hooks').exists(): fail('Hooks are excluded by default')
if (PLUGIN/'.mcp.json').exists(): fail('MCP config must not be shipped by default')
if any(k in json.loads((PLUGIN/'package.json').read_text()) for k in ['scripts','dependencies']) if (PLUGIN/'package.json').exists() else False: fail('Unexpected package lifecycle/dependencies')
engine=PLUGIN/'tools/flow-engine.mjs'
if not engine.exists(): fail('Workflow engine missing')
preview=(PLUGIN/'tools/preview-server.mjs').read_text(encoding='utf-8')
for token in ["const HOST = '127.0.0.1'", "script-src 'none'", "GET' && req.method !== 'HEAD'", 'O_NOFOLLOW']:
    if token not in preview: fail(f'Preview security control missing: {token}')
if errors:
    print('\n'.join('FAIL: '+x for x in errors)); sys.exit(1)
print(f'PASS: {len(skills)} skills, {len(agents)} agents, manifest alignment, schemas/tools, no hooks/MCP defaults, preview controls')
