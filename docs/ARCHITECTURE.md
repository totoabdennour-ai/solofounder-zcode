# Architecture — SoloFounder 2.0

## Runtime model

- **ZCode Agent (primary):** interprets the user goal, chooses workflow complexity/risk, delegates independent work, integrates results, and communicates with the user.
- **Skills:** reusable procedures loaded on demand; not executable workers.
- **Subagents:** isolated ZCode worker contexts registered through `agents/*.md`. Actual invocation depends on the runtime and must be observed, not inferred from file existence.
- **Workflow engine:** a local deterministic state machine for dependencies, stage states, check evidence, plan approvals, stage approvals, external-action approvals, and audit history.
- **Learning ledger:** a project-local JSONL proposal/review queue; nothing is promoted without a human decision.
- **Optional preview:** manually invoked static localhost server with no write/event endpoint.

## Separation of responsibilities

The primary Agent owns workflow state and final integration. Architect/research/security/quality subagents are read-only. Implementation and test agents may write within their assigned task scope. Do not concurrently assign overlapping write scopes.

## Data flow

`User goal -> assessment -> workflow.json -> approval -> bounded stage work -> evidence records -> approval -> next dependency -> handover -> learning proposal`

The engine never starts agents, runs shell commands, contacts remote systems, or performs external side effects. It validates requested state transitions only.

## Why the engine is not an authorization system

A user or agent with filesystem write access can modify `.solofounder/flow.json` directly. The CLI makes the intended process explicit and testable; it is not cryptographic tamper protection. OS permissions, ZCode permissions, code review, and external-system authorization remain authoritative.
