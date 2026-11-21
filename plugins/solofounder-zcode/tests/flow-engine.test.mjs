import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflow, assessRequest, validateWorkflow, approvePlan, startStage, recordCheck, approveStage, blockStage, resumeStage, completeWorkflow, registerExternalAction, approveExternalAction, completeExternalAction, denyExternalAction, cancelExternalAction } from '../tools/flow-engine.mjs';

test('adaptive classification is proportionate and high risk cannot be quick', () => {
  assert.equal(assessRequest({goal:'Fix typo'}).complexity,'quick');
  assert.equal(assessRequest({goal:'Integrate payment API and deploy customer database migration',risk:'low'}).complexity,'complex');
  assert.equal(assessRequest({goal:'Delete production database',risk:'low'}).risk,'critical');
  assert.equal(assessRequest({goal:'Call external API',risk:'low'}).risk,'moderate');
  assert.equal(assessRequest({goal:'One quick change',risk:'critical',forceComplexity:'quick'}).complexity,'standard');
});

test('dependency graph validation detects cycles and unknown dependencies', () => {
  const wf=createWorkflow({goal:'Build app',complexity:'standard'});
  wf.stages[0].dependsOn=['missing'];
  assert.ok(validateWorkflow(wf).some(e=>e.includes('Unknown dependency')));
  wf.stages[0].dependsOn=['verify-handover'];
  assert.ok(validateWorkflow(wf).some(e=>e.includes('cycle')));
});

test('standard workflow enforces plan approval, stage dependencies, evidence, and human approval', () => {
  const wf=createWorkflow({goal:'Build a small feature',complexity:'standard'});
  assert.throws(()=>startStage(wf,'discover-plan'),/Plan approval/);
  approvePlan(wf,'owner');
  startStage(wf,'discover-plan');
  assert.throws(()=>approveStage(wf,{stageId:'discover-plan',by:'owner'}),/incomplete/);
  assert.throws(()=>recordCheck(wf,{stageId:'discover-plan',checkId:'scope',status:'passed',evidence:''}),/requires evidence/);
  recordCheck(wf,{stageId:'discover-plan',checkId:'scope',status:'passed',evidence:'requirements.md reviewed'});
  recordCheck(wf,{stageId:'discover-plan',checkId:'plan',status:'passed',evidence:'flow.md reviewed'});
  assert.throws(()=>approveStage(wf,{stageId:'discover-plan'}),/approver identity/);
  approveStage(wf,{stageId:'discover-plan',by:'owner'});
  assert.throws(()=>startStage(wf,'verify-handover'),/Dependency not complete/);
  startStage(wf,'implement');
  recordCheck(wf,{stageId:'implement',checkId:'implementation',status:'passed',evidence:'diff inspected'});
  recordCheck(wf,{stageId:'implement',checkId:'regression',status:'passed',evidence:'node --test: exit 0'});
  approveStage(wf,{stageId:'implement'});
  startStage(wf,'verify-handover');
  for (const c of ['review','evidence','handover']) recordCheck(wf,{stageId:'verify-handover',checkId:c,status:'passed',evidence:`evidence:${c}`});
  approveStage(wf,{stageId:'verify-handover',by:'owner'});
  assert.equal(wf.status,'ready_to_close');
  completeWorkflow(wf,{by:'owner'});
  assert.equal(wf.status,'completed');
});

test('blocking requires resolution before resume', () => {
  const wf=createWorkflow({goal:'Quick task',complexity:'quick'});
  startStage(wf,'deliver-verify');
  blockStage(wf,{stageId:'deliver-verify',severity:'high',summary:'Test environment unavailable'});
  assert.throws(()=>approveStage(wf,{stageId:'deliver-verify',by:'owner'}));
  resumeStage(wf,{stageId:'deliver-verify',resolution:'Disposable test environment restored'});
  for (const c of ['acceptance','verification']) recordCheck(wf,{stageId:'deliver-verify',checkId:c,status:'passed',evidence:'check output'});
  approveStage(wf,{stageId:'deliver-verify'});
  assert.equal(wf.status,'ready_to_close');
});

test('not-applicable required check needs a reason', () => {
  const wf=createWorkflow({goal:'Quick task',complexity:'quick'});
  startStage(wf,'deliver-verify');
  assert.throws(()=>recordCheck(wf,{stageId:'deliver-verify',checkId:'verification',status:'not_applicable'}),/requires a reason/);
});


test('external side effects require action-specific human approval and evidence', () => {
  const wf=createWorkflow({goal:'Publish a public integration',complexity:'standard'});
  registerExternalAction(wf,{id:'publish-docs',description:'Publish public docs',target:'https://docs.example.test/release',risk:'high'});
  assert.throws(()=>completeExternalAction(wf,{id:'publish-docs',evidence:'published'}),/explicit approval/);
  assert.throws(()=>approveExternalAction(wf,{id:'publish-docs',by:'owner',scope:'publish'}),/exact registered target/);
  approveExternalAction(wf,{id:'publish-docs',by:'owner',scope:'Publish only release documentation to https://docs.example.test/release'});
  assert.throws(()=>completeExternalAction(wf,{id:'publish-docs',evidence:''}),/evidence/);
  completeExternalAction(wf,{id:'publish-docs',evidence:'deployment run #42'});
  assert.equal(wf.externalActions[0].status,'completed');
});


test('denied external action is auditable and does not remain pending', () => {
  const wf=createWorkflow({goal:'Release feature',complexity:'standard'});
  registerExternalAction(wf,{id:'release',description:'Publish release',target:'https://example.test/releases/v2',risk:'high'});
  denyExternalAction(wf,{id:'release',by:'owner',reason:'Release window not approved'});
  assert.equal(wf.externalActions[0].status,'denied');
  assert.throws(()=>approveExternalAction(wf,{id:'release',by:'owner',scope:'Publish to https://example.test/releases/v2'}),/denied/);
});


test('critical/high findings block; resolution is required before resuming', () => {
  const wf=createWorkflow({goal:'Fix task',complexity:'quick'});
  startStage(wf,'deliver-verify');
  blockStage(wf,{stageId:'deliver-verify',severity:'high',summary:'Required service is unavailable',evidence:'run #17'});
  assert.equal(wf.status,'blocked');
  assert.equal(wf.stages[0].status,'blocked');
  assert.throws(()=>startStage(wf,'deliver-verify'),/workflow is blocked/);
  resumeStage(wf,{stageId:'deliver-verify',resolution:'Service restored and health check passed'});
  assert.equal(wf.status,'active');
});

test('medium/low findings are recorded as notices and do not halt work', () => {
  const wf=createWorkflow({goal:'Fix task',complexity:'quick'});
  startStage(wf,'deliver-verify');
  blockStage(wf,{stageId:'deliver-verify',severity:'medium',summary:'Optional test fixture is missing'});
  blockStage(wf,{stageId:'deliver-verify',severity:'low',summary:'Documentation could be clearer'});
  assert.equal(wf.status,'active');
  assert.equal(wf.stages[0].status,'in_progress');
  assert.deepEqual(wf.stages[0].notices.map(x=>x.severity),['medium','low']);
  assert.equal(wf.auditLog.filter(x=>x.action==='stage_notice_recorded').length,2);
});

test('an approved but cancelled external action does not block workflow closure', () => {
  const wf=createWorkflow({goal:'Release note',complexity:'quick'});
  registerExternalAction(wf,{id:'publish',description:'Publish note',target:'https://example.test/note',risk:'medium'});
  approveExternalAction(wf,{id:'publish',by:'owner',scope:'Publish https://example.test/note only'});
  cancelExternalAction(wf,{id:'publish',by:'owner',reason:'Release deferred'});
  assert.equal(wf.externalActions[0].status,'cancelled');
});
