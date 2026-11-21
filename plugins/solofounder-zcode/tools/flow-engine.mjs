#!/usr/bin/env node
/**
 * SoloFounder workflow state engine. Node.js built-ins only.
 * All state is workspace-local. Commands are explicit; no hooks or background work.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const ENGINE_VERSION = '2.0.0';
export const COMPLEXITIES = ['quick', 'standard', 'complex'];
export const RISKS = ['low', 'moderate', 'high', 'critical'];
const STAGE_STATES = ['pending', 'in_progress', 'blocked', 'completed'];

function slug(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'project';
}

export function assessRequest({ goal, risk = 'low', forceComplexity = 'auto' }) {
  if (!goal || !String(goal).trim()) throw new Error('A non-empty goal is required');
  if (!RISKS.includes(risk)) throw new Error(`Unknown risk level: ${risk}`);
  const text = String(goal).toLowerCase();
  const markers = [
    ['multiple workstreams', /\b(integrat|workflow|platform|system|end-to-end|multi[- ]?step|several|multiple)\w*/i],
    ['external boundary', /\b(api|webhook|oauth|payment|meta|database|third[- ]party|external)\b/i],
    ['high-impact operation', /\b(deploy|migration|delete|publish|customer data|credential|secret|permission|security|personal data)\b/i],
    ['broad deliverable', /\b(build|create|launch|architect|redesign|automate|implement)\b/i],
  ].filter(([, re]) => re.test(text)).map(([label]) => label);
  const criticalSignal = /\b(drop|wipe|destroy|delete|truncate)\b.{0,50}\b(production|prod|live)\b|\b(production|prod|live)\b.{0,50}\b(drop|wipe|destroy|delete|truncate)\b/i.test(text);
  const highSignal = /\b(production|prod|deploy|migration|delete|payment|credential|secret|password|customer data|personal data|pii|access control|permission change|publish|send email|send message)\b/i.test(text);
  const moderateSignal = /\b(api|webhook|oauth|third[- ]party|external service|database|integration)\b/i.test(text);
  const levels = { low:0, moderate:1, high:2, critical:3 };
  const detectedRisk = criticalSignal ? 'critical' : highSignal ? 'high' : moderateSignal ? 'moderate' : 'low';
  const effectiveRisk = levels[detectedRisk] > levels[risk] ? detectedRisk : risk;
  const reasons = [...markers];
  if (detectedRisk !== 'low') reasons.push(`risk signal: ${detectedRisk}`);
  let complexity = forceComplexity;
  if (forceComplexity === 'auto') {
    complexity = (markers.length >= 3 || text.length > 360 || effectiveRisk === 'high' || effectiveRisk === 'critical')
      ? 'complex' : (markers.length >= 2 || text.length > 120 || effectiveRisk === 'moderate') ? 'standard' : 'quick';
  }
  if (!COMPLEXITIES.includes(complexity)) throw new Error(`Unknown complexity: ${complexity}`);
  if ((effectiveRisk === 'high' || effectiveRisk === 'critical') && complexity === 'quick') complexity = 'standard';
  return { complexity, risk: effectiveRisk, reasons, heuristic: true };
}

function check(id, description) {
  return { id, description, required: true, status: 'pending', evidence: [] };
}

function makeStages(complexity) {
  if (complexity === 'quick') return [{
    id: 'deliver-verify', title: 'Deliver and verify', goal: 'Complete the bounded request and verify the observable result.',
    dependsOn: [], approvalRequired: false, status: 'pending', outputs: [],
    checks: [check('acceptance', 'The requested outcome matches the stated acceptance criteria.'), check('verification', 'The relevant check was run after the final change and its evidence is recorded.')], exception: null
  }];
  const standard = [
    { id: 'discover-plan', title: 'Discover and plan', goal: 'Resolve material uncertainty and agree a proportionate implementation plan.', dependsOn: [], approvalRequired: true, outputs: [], checks: [check('scope', 'Scope, assumptions, constraints, and exclusions are documented.'), check('plan', 'Stages, deliverables, acceptance checks, and approval boundaries are explicit.')], exception: null },
    { id: 'implement', title: 'Implement', goal: 'Deliver the approved change within its defined scope.', dependsOn: ['discover-plan'], approvalRequired: false, outputs: [], checks: [check('implementation', 'The approved change is implemented without unrelated edits.'), check('regression', 'Focused regression checks pass, or the reason TDD is unsuitable is documented.')], exception: null },
    { id: 'verify-handover', title: 'Review and hand over', goal: 'Independently assess the result, verify acceptance, and communicate residual risk.', dependsOn: ['implement'], approvalRequired: true, outputs: [], checks: [check('review', 'Final review findings are resolved or explicitly accepted.'), check('evidence', 'All required acceptance criteria have fresh supporting evidence.'), check('handover', 'Changed files, results, limitations, and next steps are documented.')], exception: null }
  ];
  if (complexity === 'standard') return standard.map(s => ({ ...s, status: 'pending' }));
  return [
    { id: 'discovery', title: 'Discovery and requirements', goal: 'Establish user outcome, scope, constraints, stakeholders, and measurable acceptance criteria.', dependsOn: [], approvalRequired: true, outputs: [], checks: [check('requirements', 'Requirements and exclusions are documented.'), check('risk', 'Data, security, operational, and external-action risks are assessed.')], exception: null },
    { id: 'research-architecture', title: 'Research and architecture', goal: 'Verify material external facts and select an evidence-backed design.', dependsOn: ['discovery'], approvalRequired: true, outputs: [], checks: [check('sources', 'Time-sensitive claims use dated primary sources where applicable.'), check('decisions', 'Architecture or strategy decisions include rationale and trade-offs.')], exception: null },
    { id: 'plan-approval', title: 'Implementation plan', goal: 'Decompose the approved design into bounded tasks, owners, dependencies, and recovery plans.', dependsOn: ['research-architecture'], approvalRequired: true, outputs: [], checks: [check('tasks', 'Tasks have owners, inputs, outputs, and completion criteria.'), check('rollback', 'High-impact changes have a rollback or recovery plan.')], exception: null },
    { id: 'implementation', title: 'Implementation', goal: 'Implement the approved tasks using small changes and fit-for-purpose tests.', dependsOn: ['plan-approval'], approvalRequired: false, outputs: [], checks: [check('scope', 'Implementation remains within approved scope.'), check('tests', 'Relevant tests and checks pass with fresh evidence.')], exception: null },
    { id: 'independent-verification', title: 'Independent review and verification', goal: 'Review the final diff and prove the accepted outcomes with independent evidence.', dependsOn: ['implementation'], approvalRequired: true, outputs: [], checks: [check('security', 'Security and privacy review is complete or not applicable with reason.'), check('acceptance', 'All required acceptance criteria are verified.'), check('residual-risk', 'Unresolved risks and unverified areas are disclosed.')], exception: null },
    { id: 'handover-learning', title: 'Handover and learning', goal: 'Document operation, maintenance, rollback, and proposed reusable lessons.', dependsOn: ['independent-verification'], approvalRequired: false, outputs: [], checks: [check('handover', 'Handover documentation is complete.'), check('learning', 'Any retained lesson is project-scoped and remains a proposal pending human approval.')], exception: null }
  ].map(s => ({ ...s, status: 'pending' }));
}

export function createWorkflow({ goal, title, complexity = 'auto', risk = 'low', constraints = [], assumptions = [], acceptanceCriteria = [] }) {
  const assessment = assessRequest({ goal, risk, forceComplexity: complexity });
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, engineVersion: ENGINE_VERSION, id: `${slug(title || goal)}-${randomUUID().slice(0, 8)}`,
    title: title || String(goal).trim().slice(0, 100), goal: String(goal).trim(),
    complexity: assessment.complexity, risk: assessment.risk, classificationReasons: assessment.reasons,
    status: 'active', revision: 1, createdAt: now, updatedAt: now,
    constraints: [...constraints], assumptions: [...assumptions],
    acceptanceCriteria: acceptanceCriteria.length ? [...acceptanceCriteria] : ['The stated user outcome is delivered.', 'All required checks pass with evidence.', 'Known limitations and residual risks are disclosed.'],
    planApproval: { required: assessment.complexity !== 'quick', status: assessment.complexity === 'quick' ? 'not_required' : 'pending', approvedBy: null, approvedAt: null },
    stages: makeStages(assessment.complexity).map(stage => ({ ...stage, notices: [] })),
    externalActions: [], auditLog: [{ at: now, actor: 'system', action: 'workflow_created', detail: `complexity=${assessment.complexity}; risk=${assessment.risk}` }]
  };
}

export function validateWorkflow(wf) {
  const errors = [];
  if (!wf || typeof wf !== 'object') return ['Workflow must be a JSON object'];
  for (const field of ['schemaVersion','id','title','goal','complexity','risk','status','revision','stages','planApproval']) if (!(field in wf)) errors.push(`Missing field: ${field}`);
  if (wf.schemaVersion !== 1) errors.push('Unsupported schemaVersion');
  if (!['active','blocked','ready_to_close','completed','cancelled'].includes(wf.status)) errors.push('Invalid workflow status');
  if (!COMPLEXITIES.includes(wf.complexity)) errors.push('Invalid complexity');
  if (!RISKS.includes(wf.risk)) errors.push('Invalid risk');
  if (!Array.isArray(wf.stages) || wf.stages.length === 0) errors.push('At least one stage is required');
  const ids = new Set();
  for (const stage of (wf.stages || [])) {
    if (!stage.id || ids.has(stage.id)) errors.push(`Missing or duplicate stage id: ${stage.id}`);
    ids.add(stage.id);
    if (!STAGE_STATES.includes(stage.status)) errors.push(`Invalid state for stage ${stage.id}`);
    if (!Array.isArray(stage.dependsOn) || !Array.isArray(stage.checks)) errors.push(`Stage ${stage.id} must define dependsOn and checks arrays`);
    const checkIds = new Set();
    for (const c of (stage.checks || [])) {
      if (!c.id || checkIds.has(c.id)) errors.push(`Missing or duplicate check id in stage ${stage.id}: ${c.id}`);
      checkIds.add(c.id);
      if (!['pending','passed','failed','not_applicable'].includes(c.status)) errors.push(`Invalid check state ${c.status} in ${stage.id}/${c.id}`);
      if (c.status === 'passed' && c.required && !(c.evidence || []).length) errors.push(`Passed required check has no evidence: ${stage.id}/${c.id}`);
    }
  }
  if (wf.planApproval && !['pending','approved','not_required'].includes(wf.planApproval.status)) errors.push('Invalid plan approval state');
  const externalIds = new Set();
  for (const action of (wf.externalActions || [])) {
    if (!action.id || externalIds.has(action.id)) errors.push(`Missing or duplicate external action id: ${action.id}`);
    externalIds.add(action.id);
    if (!['pending_approval','approved','completed','denied','cancelled'].includes(action.status)) errors.push(`Invalid external action state: ${action.id}`);
    if (action.status === 'approved' && (!action.approval?.scope || !action.approval.scope.includes(action.target))) errors.push(`External action approval scope does not include target: ${action.id}`);
    if (action.status === 'completed' && !action.completionEvidence) errors.push(`Completed external action has no evidence: ${action.id}`);
  }
  for (const stage of (wf.stages || [])) for (const dep of (stage.dependsOn || [])) if (!ids.has(dep)) errors.push(`Unknown dependency ${dep} in stage ${stage.id}`);
  // Reject cycles with DFS.
  const byId = new Map((wf.stages || []).map(s => [s.id, s]));
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`Dependency cycle includes ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of (byId.get(id)?.dependsOn || [])) if (byId.has(dep)) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return [...new Set(errors)];
}

function assertValid(wf) {
  const errors = validateWorkflow(wf);
  if (errors.length) throw new Error(`Invalid workflow:\n- ${errors.join('\n- ')}`);
}
function stageById(wf, id) {
  const stage = wf.stages.find(s => s.id === id);
  if (!stage) throw new Error(`Stage not found: ${id}`);
  return stage;
}
function log(wf, actor, action, detail) {
  const now = new Date().toISOString();
  wf.updatedAt = now; wf.revision += 1;
  wf.auditLog.push({ at: now, actor, action, detail });
}

export function approvePlan(wf, by) {
  assertValid(wf);
  if (!wf.planApproval.required) throw new Error('Plan approval is not required for this workflow');
  if (!by?.trim()) throw new Error('Approver identity is required');
  if (wf.planApproval.status !== 'pending') throw new Error(`Plan approval is ${wf.planApproval.status}`);
  wf.planApproval = { required: true, status: 'approved', approvedBy: by.trim(), approvedAt: new Date().toISOString() };
  log(wf, by.trim(), 'plan_approved', 'Plan approval recorded');
}

export function startStage(wf, id, actor = 'primary-agent') {
  assertValid(wf);
  const stage = stageById(wf, id);
  if (wf.planApproval.status === 'pending') throw new Error('Plan approval is required before execution');
  if (wf.status !== 'active') throw new Error(`Cannot start a stage while workflow is ${wf.status}`);
  if (stage.status !== 'pending') throw new Error(`Cannot start stage in state ${stage.status}`);
  for (const dep of stage.dependsOn) if (stageById(wf, dep).status !== 'completed') throw new Error(`Dependency not complete: ${dep}`);
  stage.status = 'in_progress'; stage.startedAt = new Date().toISOString();
  log(wf, actor, 'stage_started', id);
}

export function recordCheck(wf, { stageId, checkId, status, evidence, note = '', actor = 'primary-agent' }) {
  assertValid(wf);
  const stage = stageById(wf, stageId);
  if (stage.status !== 'in_progress') throw new Error('Checks can only be recorded for an in-progress stage');
  if (!['passed','failed','not_applicable'].includes(status)) throw new Error('status must be passed, failed, or not_applicable');
  const item = stage.checks.find(c => c.id === checkId);
  if (!item) throw new Error(`Check not found: ${checkId}`);
  if (status === 'passed' && !String(evidence || '').trim()) throw new Error('Passing a check requires evidence');
  if (status === 'not_applicable' && !String(note || '').trim()) throw new Error('not_applicable requires a reason');
  item.status = status;
  item.note = note;
  item.evidence = status === 'passed' ? [...(item.evidence || []), { at: new Date().toISOString(), reference: String(evidence).trim() }] : (item.evidence || []);
  item.checkedAt = new Date().toISOString();
  log(wf, actor, 'check_recorded', `${stageId}/${checkId}=${status}`);
}

export function blockStage(wf, { stageId, severity, summary, evidence = '', actor = 'primary-agent' }) {
  assertValid(wf);
  const stage = stageById(wf, stageId);
  if (stage.status !== 'in_progress') throw new Error('Only an in-progress stage can receive a finding');
  if (!['critical','high','medium','low'].includes(severity)) throw new Error('Invalid severity');
  if (!String(summary || '').trim()) throw new Error('Finding summary is required');
  const finding = { severity, summary: String(summary).trim(), evidence: String(evidence || '').trim(), recordedAt: new Date().toISOString() };
  if (severity === 'medium' || severity === 'low') {
    stage.notices = [...(stage.notices || []), finding];
    log(wf, actor, 'stage_notice_recorded', `${stageId}: ${severity}`);
    return;
  }
  stage.status = 'blocked';
  stage.exception = { ...finding, status: 'open', raisedAt: finding.recordedAt };
  wf.status = 'blocked';
  log(wf, actor, 'stage_blocked', `${stageId}: ${severity}`);
}

export function resumeStage(wf, { stageId, resolution, actor = 'primary-agent' }) {
  assertValid(wf);
  const stage = stageById(wf, stageId);
  if (stage.status !== 'blocked' || !stage.exception || stage.exception.status !== 'open') throw new Error('Stage has no open blocker');
  if (!String(resolution || '').trim()) throw new Error('Resolution evidence/summary is required');
  stage.exception.status = 'resolved'; stage.exception.resolution = String(resolution).trim(); stage.exception.resolvedAt = new Date().toISOString();
  stage.status = 'in_progress';
  if (!wf.stages.some(s => s.status === 'blocked')) wf.status = 'active';
  log(wf, actor, 'stage_resumed', `${stageId}: ${resolution}`);
}

export function approveStage(wf, { stageId, by }) {
  assertValid(wf);
  const stage = stageById(wf, stageId);
  if (stage.status !== 'in_progress') throw new Error('Only an in-progress stage can be approved');
  const failed = stage.checks.filter(c => c.required && c.status !== 'passed' && c.status !== 'not_applicable');
  const invalidNA = stage.checks.filter(c => c.required && c.status === 'not_applicable' && !c.note?.trim());
  const noEvidence = stage.checks.filter(c => c.required && c.status === 'passed' && !(c.evidence || []).length);
  if (failed.length || invalidNA.length || noEvidence.length) throw new Error(`Stage checks incomplete: ${[...failed,...invalidNA,...noEvidence].map(c=>c.id).join(', ')}`);
  if (stage.approvalRequired && !String(by || '').trim()) throw new Error('User approver identity is required');
  stage.status = 'completed'; stage.completedAt = new Date().toISOString();
  stage.approval = { status: stage.approvalRequired ? 'approved' : 'not_required', approvedBy: stage.approvalRequired ? by.trim() : null, approvedAt: stage.approvalRequired ? new Date().toISOString() : null };
  log(wf, by || 'primary-agent', 'stage_approved', stageId);
  if (wf.stages.every(s => s.status === 'completed')) wf.status = 'ready_to_close';
}

export function registerExternalAction(wf, { id, description, target, risk, actor = 'primary-agent' }) {
  assertValid(wf);
  if (!id || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(id)) throw new Error('External action id must be a simple identifier');
  if (wf.externalActions.some(a => a.id === id)) throw new Error(`External action already exists: ${id}`);
  if (!String(description || '').trim() || !String(target || '').trim()) throw new Error('External action description and exact target are required');
  if (!['low','medium','high','critical'].includes(risk)) throw new Error('Invalid external action risk');
  wf.externalActions.push({ id, description: description.trim(), target: target.trim(), risk, status: 'pending_approval', approval: null, completionEvidence: null });
  log(wf, actor, 'external_action_registered', `${id}: ${risk}`);
}

export function approveExternalAction(wf, { id, by, scope }) {
  assertValid(wf);
  const action = wf.externalActions.find(a => a.id === id);
  if (!action) throw new Error(`External action not found: ${id}`);
  if (action.status !== 'pending_approval') throw new Error(`External action is ${action.status}`);
  if (!String(by || '').trim() || !String(scope || '').trim()) throw new Error('Approver identity and exact approved scope are required');
  if (!scope.includes(action.target)) throw new Error('Approved scope must explicitly include the exact registered target');
  action.status = 'approved';
  action.approval = { by: by.trim(), scope: scope.trim(), approvedAt: new Date().toISOString() };
  log(wf, by.trim(), 'external_action_approved', `${id}: ${scope}`);
}

export function denyExternalAction(wf, { id, by, reason }) {
  assertValid(wf);
  const action = wf.externalActions.find(a => a.id === id);
  if (!action) throw new Error(`External action not found: ${id}`);
  if (action.status !== 'pending_approval') throw new Error(`External action is ${action.status}`);
  if (!String(by || '').trim() || !String(reason || '').trim()) throw new Error('Decision maker and denial reason are required');
  action.status = 'denied'; action.denial = { by: by.trim(), reason: reason.trim(), deniedAt: new Date().toISOString() };
  log(wf, by.trim(), 'external_action_denied', id);
}

export function cancelExternalAction(wf, { id, by, reason }) {
  assertValid(wf);
  const action = wf.externalActions.find(a => a.id === id);
  if (!action) throw new Error(`External action not found: ${id}`);
  if (action.status !== 'approved') throw new Error('Only an approved, not-yet-completed action can be cancelled');
  if (!String(by || '').trim() || !String(reason || '').trim()) throw new Error('Decision maker and cancellation reason are required');
  action.status = 'cancelled'; action.cancellation = { by: by.trim(), reason: reason.trim(), cancelledAt: new Date().toISOString() };
  log(wf, by.trim(), 'external_action_cancelled', id);
}

export function completeExternalAction(wf, { id, evidence, actor = 'primary-agent' }) {
  assertValid(wf);
  const action = wf.externalActions.find(a => a.id === id);
  if (!action) throw new Error(`External action not found: ${id}`);
  if (action.status !== 'approved') throw new Error('External action requires an explicit approval before completion');
  if (!String(evidence || '').trim()) throw new Error('Completion evidence is required');
  action.status = 'completed'; action.completionEvidence = String(evidence).trim(); action.completedAt = new Date().toISOString();
  log(wf, actor, 'external_action_completed', id);
}

export function completeWorkflow(wf, { by }) {
  assertValid(wf);
  if (wf.status !== 'ready_to_close') throw new Error('All stages must be completed before closing the workflow');
  const pendingActions = (wf.externalActions || []).filter(a => !['completed','denied','cancelled'].includes(a.status));
  if (pendingActions.length) throw new Error(`External actions unresolved: ${pendingActions.map(a=>a.id).join(', ')}`);
  if (!String(by || '').trim()) throw new Error('Final approver identity is required');
  wf.status = 'completed'; wf.completedAt = new Date().toISOString();
  log(wf, by.trim(), 'workflow_completed', 'All stages completed; final handover accepted');
}

function parseArgs(args) {
  const out = { _: [] };
  for (let i=0;i<args.length;i++) {
    const a=args[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key=a.slice(2);
    if (['help'].includes(key)) { out[key]=true; continue; }
    const value=args[i+1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    out[key]=value; i++;
  }
  return out;
}
const DEFAULT_FILE = path.resolve('.solofounder/flow.json');
async function loadFile(file) {
  const target = path.resolve(file || DEFAULT_FILE);
  const st = await fs.lstat(target).catch(e => e.code === 'ENOENT' ? null : Promise.reject(e));
  if (!st) throw new Error(`Workflow file not found: ${target}`);
  if (!st.isFile() || st.isSymbolicLink()) throw new Error('Workflow state must be a regular non-symlink file');
  const raw = await fs.readFile(target, 'utf8');
  const wf = JSON.parse(raw); assertValid(wf); return { target, wf };
}
async function saveFile(target, wf) {
  const st = await fs.lstat(target).catch(e => e.code === 'ENOENT' ? null : Promise.reject(e));
  if (st && (!st.isFile() || st.isSymbolicLink())) throw new Error('Refusing to overwrite a non-regular or symlink workflow file');
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await fs.open(temp, 'wx', 0o600);
  try { await handle.writeFile(`${JSON.stringify(wf,null,2)}\n`, 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  await fs.rename(temp, target);
}
function printHelp() {
  console.log(`SoloFounder Flow Engine ${ENGINE_VERSION}\n\nCommands:\n  init --goal <text> [--title <text>] [--complexity auto|quick|standard|complex] [--risk low|moderate|high|critical]\n  validate [--file <path>]\n  status [--file <path>]\n  approve-plan --by <name> [--file <path>]\n  start-stage --stage <id> [--by <name>] [--file <path>]\n  record-check --stage <id> --check <id> --status passed|failed|not_applicable [--evidence <ref>] [--note <text>] [--file <path>]\n  block-stage --stage <id> --severity critical|high|medium|low --summary <text> [--evidence <ref>] [--file <path>]\n  resume-stage --stage <id> --resolution <text> [--file <path>]\n  approve-stage --stage <id> [--by <name>] [--file <path>]\n  register-external --id <id> --description <text> --target <exact target> --risk low|medium|high|critical [--file <path>]\n  approve-external --id <id> --by <name> --scope <exact approved scope> [--file <path>]\n  complete-external --id <id> --evidence <result reference> [--file <path>]\n  deny-external --id <id> --by <name> --reason <reason> [--file <path>]\n  cancel-external --id <id> --by <name> --reason <reason> [--file <path>]\n  complete --by <name> [--file <path>]\n\nDefault state: .solofounder/flow.json`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const a = parseArgs(rest);
  if (!command || command === 'help' || a.help) return printHelp();
  if (command === 'init') {
    const wf = createWorkflow({ goal:a.goal, title:a.title, complexity:a.complexity || 'auto', risk:a.risk || 'low' });
    const target = path.resolve(a.file || DEFAULT_FILE);
    await saveFile(target, wf);
    console.log(JSON.stringify({ file:target, id:wf.id, complexity:wf.complexity, risk:wf.risk, stages:wf.stages.map(s=>s.id) },null,2));
    return;
  }
  const { target, wf } = await loadFile(a.file);
  const actor = a.by || 'primary-agent';
  switch (command) {
    case 'validate': console.log(JSON.stringify({ valid:true, revision:wf.revision, stages:wf.stages.length })); return;
    case 'status': console.log(JSON.stringify({ id:wf.id,title:wf.title,status:wf.status,complexity:wf.complexity,risk:wf.risk,revision:wf.revision,planApproval:wf.planApproval,stages:wf.stages.map(s=>({id:s.id,title:s.title,status:s.status,checks:s.checks.map(c=>({id:c.id,status:c.status}))})) },null,2)); return;
    case 'approve-plan': approvePlan(wf,actor); break;
    case 'start-stage': startStage(wf,a.stage,actor); break;
    case 'record-check': recordCheck(wf,{stageId:a.stage,checkId:a.check,status:a.status,evidence:a.evidence,note:a.note,actor}); break;
    case 'block-stage': blockStage(wf,{stageId:a.stage,severity:a.severity,summary:a.summary,evidence:a.evidence,actor}); break;
    case 'resume-stage': resumeStage(wf,{stageId:a.stage,resolution:a.resolution,actor}); break;
    case 'approve-stage': approveStage(wf,{stageId:a.stage,by:a.by}); break;
    case 'register-external': registerExternalAction(wf,{id:a.id,description:a.description,target:a.target,risk:a.risk,actor}); break;
    case 'approve-external': approveExternalAction(wf,{id:a.id,by:a.by,scope:a.scope}); break;
    case 'complete-external': completeExternalAction(wf,{id:a.id,evidence:a.evidence,actor}); break;
    case 'deny-external': denyExternalAction(wf,{id:a.id,by:a.by,reason:a.reason}); break;
    case 'cancel-external': cancelExternalAction(wf,{id:a.id,by:a.by,reason:a.reason}); break;
    case 'complete': completeWorkflow(wf,{by:a.by}); break;
    default: throw new Error(`Unknown command: ${command}`);
  }
  await saveFile(target,wf);
  console.log(JSON.stringify({ ok:true, command, revision:wf.revision, status:wf.status, file:target }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(err => { console.error(`flow-engine: ${err.message}`); process.exitCode=1; });
