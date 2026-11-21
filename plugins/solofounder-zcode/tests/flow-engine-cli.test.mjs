import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const script=fileURLToPath(new URL('../tools/flow-engine.mjs',import.meta.url));
function run(args,cwd){return spawnSync(process.execPath,[script,...args],{cwd,encoding:'utf8'});}
test('CLI creates a workflow and prevents execution before plan approval',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sf-flow-cli-'));
 try{
  const file=path.join(dir,'.solofounder','flow.json');
  const init=run(['init','--goal','Build an API integration','--complexity','standard','--file',file],dir);
  assert.equal(init.status,0,init.stderr);
  const stage=run(['start-stage','--stage','discover-plan','--file',file],dir);
  assert.notEqual(stage.status,0);
  assert.match(stage.stderr,/Plan approval/);
  const valid=run(['validate','--file',file],dir);
  assert.equal(valid.status,0,valid.stderr);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('CLI refuses a symlinked state file',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sf-flow-link-'));
 try{
  const target=path.join(dir,'target.json'); await fs.writeFile(target,'{}');
  const link=path.join(dir,'flow.json');
  try{await fs.symlink(target,link);}catch{ return; }
  const status=run(['status','--file',link],dir);
  assert.notEqual(status.status,0);
  assert.match(status.stderr,/symlink/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
