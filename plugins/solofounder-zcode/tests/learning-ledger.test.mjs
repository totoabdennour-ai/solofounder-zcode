import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const script=fileURLToPath(new URL('../tools/learning-ledger.mjs',import.meta.url));
function run(args,cwd){return spawnSync(process.execPath,[script,...args],{cwd,encoding:'utf8'});}
test('learning proposals are project-local and require explicit approval',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sf-learning-'));
 try{
  const proposal=run(['propose','--text','Reject duplicate event IDs before side effects.','--source','tests/idempotency.test.mjs','--confidence','0.9'],dir);
  assert.equal(proposal.status,0,proposal.stderr);
  const id=JSON.parse(proposal.stdout).id;
  const list=run(['list'],dir); assert.match(list.stdout,/\[proposed\]/);
  const approve=run(['approve','--id',id,'--by','owner'],dir); assert.equal(approve.status,0,approve.stderr);
  const final=run(['list'],dir); assert.match(final.stdout,/\[approved\]/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('learning ledger rejects secret-looking content',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sf-learning-secret-'));
 try{const r=run(['propose','--text','api_key=supersecret123','--source','example'],dir);assert.notEqual(r.status,0);assert.match(r.stderr,/resembles a secret/);}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
