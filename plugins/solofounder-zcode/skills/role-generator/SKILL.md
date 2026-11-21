---
name: role-generator
description: Use after the workflow direction is approved to select or create a minimal set of specialist roles and delegate bounded independent tasks to ZCode subagents.
---

# Role Generator

## Principle

Optimize for coverage and independent judgment, not headcount. A role file is an instruction profile; it becomes a separate worker only when the ZCode Agent actually dispatches that subagent.

## Selection

Choose only roles needed by the accepted stages:
- Research Analyst: current external facts and primary-source evidence.
- Project Architect: requirements, system boundaries, architecture trade-offs, dependency mapping.
- Implementation Engineer: a bounded code/configuration change.
- Test Engineer: test strategy, regression cases, test execution, result interpretation.
- Security Reviewer: trust boundaries, permissions, secret handling, injection, data exposure, dependency and runtime risks.
- Quality Reviewer: cross-check deliverable against requirements, correctness, consistency, and evidence.

For low-risk work, the primary Agent may perform all roles without delegation. For complex work, parallelize independent research and review; keep implementation ownership singular per file set.

## Delegation contract

For each subagent pass:
1. Task objective and why it is independent
2. Exact paths / sources in scope
3. Allowed and forbidden actions
4. Relevant assumptions and dependencies
5. Required response format
6. Evidence and verification expectations
7. Stop condition and escalation rule

Do not pass secrets, customer data, unrelated project context, or global memory unless strictly necessary and authorized.

## Review separation

An implementer does not approve their own high-risk work. The reviewer should see acceptance criteria and final diff, not private chain-of-thought or irrelevant conversation history. Reviewers are read-only by default.

## Output

Record the roles selected, actual subagents invoked, scope delegated, results returned, and any integration work. Be explicit when a role was a reasoning perspective rather than an independently dispatched agent.
