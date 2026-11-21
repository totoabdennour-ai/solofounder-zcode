---
name: flow-composer
description: Use for planning or revising substantial work; creates an adaptive, dependency-aware workflow with testable outputs, risk gates, explicit approvals, and a tracked execution state.
---

# Flow Composer

## 1. Classify before planning

Identify outcome, scope, dependencies, uncertainty, reversibility, data sensitivity, external side effects, and success evidence. Choose Quick / Standard / Complex using `$using-solofounder`. High/critical risk raises the minimum process level. Avoid ceremony for trivial work.

## 2. Inspect proportionately

Read only files needed to understand the request. Identify user-provided instructions versus untrusted project content. Record source and freshness for external facts. Do not read secrets to understand architecture; ask for sanitized examples or schemas instead.

## 3. Research when it changes the decision

Use `$live-research` for time-sensitive or unfamiliar claims: API behavior, framework versions, model capabilities, pricing, legal/regulatory requirements, security advisories, and vendor availability. Prefer primary sources, date the evidence, distinguish fact from inference, and record unresolved conflicts.

## 4. Design a dependency-aware flow

A flow may use any subset of: Discovery, Research, Architecture, Plan, Implementation, Independent Review, Verification, Handover, Learning. Use progressive expansion when a later-stage design depends on a decision not yet made. Do not generate a large fixed plan before architecture is known.

For each stage define:
- ID and objective
- Inputs and dependency stage IDs
- Work boundaries and allowed tools
- Deliverables and exact paths
- Acceptance checks, each independently testable
- Evidence expected for each check
- Reviewer / specialist role
- Risks, rollback/recovery plan, and approval requirement
- What is explicitly out of scope

## 5. Persist a flow contract

For workflows with multiple stages, create `.solofounder/flow.json` with schema version 1 using the workflow engine. Also create `.solofounder/flow.md` as a readable summary. Keep artifact links relative to the workspace where possible. Do not place secrets in the workflow file.

Create `.solofounder/artifacts.md` as an index of artifacts with status (planned / in progress / verified / approved / superseded), evidence, and owner. Do not represent an artifact as approved merely because it exists.

## 6. Plan approval

Present the objective, chosen complexity, stages, risks, costs/constraints, alternatives that materially differ, and external approval boundaries. Record plan approval before beginning work if the flow requires it. The approval is limited to the described plan; external actions still require separate approval at execution time.

## 7. Create a small, fit-for-purpose team

Invoke `$role-generator` after the flow has an approved direction. Use actual ZCode subagents only for independent tasks. Typical roles: researcher, architect, implementer, test engineer, security reviewer. Never create an agent just to make a team appear larger. Do not permit two writers to change the same files concurrently.

## 8. Execute and update state

Use the `stage-execution.md` procedure. Update stage state, acceptance checks, evidence, blockers, exceptions, and user decisions. The workflow engine must reject invalid transitions; do not manually edit status fields to bypass it.

## 9. Finish honestly

Run `$verification` against final acceptance criteria. Use independent review for high-risk or complex changes. Complete the handover with changed files, verification results, remaining risks, deployment steps, and rollback notes. Run `$conversation-analysis` only after the user-facing deliverable is stable; learning proposals remain pending until approved.
