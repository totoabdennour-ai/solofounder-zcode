# SoloFounder 2.0 Operating Model

## What this system is

SoloFounder is a governance and workflow layer over ZCode Agent. It combines reusable skills, registered specialist subagents, a small local state engine, evidence requirements, explicit human approval boundaries, and project-scoped learning proposals. It is not an autonomous organization, a guarantee of parallel execution, or a replacement for domain experts.

## The control loop

`Request -> Risk/Complexity Assessment -> Workflow Contract -> Human Plan Approval (when required) -> Bounded Delegation -> Stage Execution -> Evidence Checks -> Independent Review -> Stage Approval -> Handover -> Learning Proposal`

The main ZCode Agent is the orchestrator. Subagents are optional, isolated workers dispatched through ZCode. Skills teach methods; tools perform actions; the state engine enforces workflow transitions and evidence presence.

## Complexity policy

| Level | Use | Expected controls |
|---|---|---|
| Quick | Single bounded low-risk outcome | Direct work, focused validation, short result |
| Standard | Several files/tasks or moderate uncertainty | Written plan, stage tracking, relevant reviewer, fresh tests |
| Complex | Multiple systems, high-impact data/security/production | Discovery, architecture, plan approval, bounded specialist delegation, independent review, evidence gates, handover |

Complexity is assessed from request scope, not from prompt length alone. High/critical risk requires at least Standard. User urgency can reduce optional ceremony, never required safety controls.

## Risk policy

Critical/high findings stop the affected operation. Medium/low issues can be documented and accepted by an authorized owner when the residual risk is understood. Recovery mechanisms are valid when bounded, observable, idempotent where required, and tested. Never silently ignore an exception.

## Data boundaries

- Workspace state belongs under `.solofounder/`.
- No global/home-directory learning is loaded or written automatically.
- Only non-sensitive, reusable lessons should be proposed.
- The ledger records proposals; humans promote them explicitly.
- Secrets and personal/customer data must not be written to plans, learning, logs, screenshots, or subagent prompts.

## Tool boundaries

- Read-only subagents inspect and report; they do not edit or execute.
- Implementation agents work within a bounded file scope.
- External side effects require action-specific approval.
- MCP tools are not configured by this plugin. Users may connect their own tools separately and must review their permissions.
- No hooks are installed by default; no auto-run on session start or tool calls.

## Completion definition

A stage is complete only when all required checks are passed with evidence, all required approvals are recorded, and no unresolved Critical/High blocker remains. A workflow is complete only when all stages are complete and final handover is accepted.
