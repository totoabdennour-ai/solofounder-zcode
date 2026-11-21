#!/usr/bin/env node
/** Project-local learning proposals. Nothing is promoted without human approval. */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';

const DEFAULT_FILE = path.resolve('.solofounder/learning/ledger.jsonl');
const SECRET_PATTERNS = [
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd|private[_-]?key)\s*[:=]\s*\S+/i,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/
];
function argsOf(argv) { const a={}; for(let i=0;i<argv.length;i++){const k=argv[i];if(!k.startsWith('--'))continue;const v=argv[++i];if(!v||v.startsWith('--'))throw new Error(`Missing value for ${k}`);a[k.slice(2)]=v;}return a; }
function safeText(s,label,max=2000){if(!s||!s.trim())throw new Error(`${label} is required`);if(s.length>max)throw new Error(`${label} exceeds ${max} characters`);if(SECRET_PATTERNS.some(r=>r.test(s)))throw new Error(`${label} resembles a secret; redact it before recording a learning item`);return s.trim();}
async function readEntries(file){const st=await fs.lstat(file).catch(e=>e.code==='ENOENT'?null:Promise.reject(e));if(!st)return [];if(!st.isFile()||st.isSymbolicLink())throw new Error('Learning ledger must be a regular non-symlink file');const raw=await fs.readFile(file,'utf8');return raw.split(/\r?\n/).filter(Boolean).map((line)=>JSON.parse(line));}
async function writeEntries(file,entries){await fs.mkdir(path.dirname(file),{recursive:true});const st=await fs.lstat(file).catch(e=>e.code==='ENOENT'?null:Promise.reject(e));if(st&&(!st.isFile()||st.isSymbolicLink()))throw new Error('Refusing to overwrite non-regular ledger');const temp=`${file}.${process.pid}.${randomUUID()}.tmp`;const h=await fs.open(temp,'wx',0o600);try{await h.writeFile(entries.map(x=>JSON.stringify(x)).join('\n')+'\n','utf8');await h.sync();}finally{await h.close();}await fs.rename(temp,file);}
async function main(){const [cmd,...rest]=process.argv.slice(2);const a=argsOf(rest);const file=path.resolve(a.file||DEFAULT_FILE);let entries=await readEntries(file);
 if(cmd==='propose'){
   const text=safeText(a.text||'','--text');const source=safeText(a.source||'','--source',500);const confidence=Number(a.confidence??0.6);if(!Number.isFinite(confidence)||confidence<0||confidence>1)throw new Error('--confidence must be 0..1');
   const entry={id:randomUUID(),createdAt:new Date().toISOString(),scope:'project',status:'proposed',text,source,confidence};entries.push(entry);await writeEntries(file,entries);console.log(JSON.stringify({id:entry.id,status:entry.status,scope:entry.scope}));return;
 }
 if(cmd==='list'){console.log(entries.map(e=>`${e.id} [${e.status}] (${e.confidence}) ${e.text}`).join('\n')||'No learning entries');return;}
 if(cmd==='approve'||cmd==='reject'){
   if(!a.id)throw new Error('--id is required');const ix=entries.findIndex(e=>e.id===a.id);if(ix<0)throw new Error('Learning item not found');if(entries[ix].status!=='proposed')throw new Error('Only proposed items can be approved/rejected');
   if(cmd==='approve'&&!a.by?.trim())throw new Error('--by is required for human approval');if(cmd==='reject'&&!a.reason?.trim())throw new Error('--reason is required');
   entries[ix]={...entries[ix],status:cmd==='approve'?'approved':'rejected',reviewedAt:new Date().toISOString(),reviewedBy:cmd==='approve'?a.by.trim():null,reason:cmd==='reject'?a.reason.trim():null};await writeEntries(file,entries);console.log(JSON.stringify({id:a.id,status:entries[ix].status}));return;
 }
 console.log('Usage: learning-ledger.mjs propose --text <lesson> --source <evidence> [--confidence 0..1]\n       learning-ledger.mjs list\n       learning-ledger.mjs approve --id <id> --by <human>\n       learning-ledger.mjs reject --id <id> --reason <reason>');
}
main().catch(e=>{console.error(`learning-ledger: ${e.message}`);process.exitCode=1;});
