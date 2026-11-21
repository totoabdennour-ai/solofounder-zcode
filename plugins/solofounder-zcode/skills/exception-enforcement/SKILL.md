---
name: exception-enforcement
description: Use when an action fails, an assumption is contradicted, evidence is missing, a requirement is unsafe, or the workflow is blocked; classifies severity and defines safe recovery.
---

# Exception Enforcement

## Operating laws

1. No silent failures, skipped checks, hidden retries, or false success claims.
2. Recommend the strongest feasible path, but expose material trade-offs and valid alternatives.
3. Every exception has evidence, impact, owner, and a next action.
4. Respect real limits: cost, time, hardware, permissions, data sensitivity, and user priorities.
5. Verify to a depth proportionate to risk; no stage advances across an unresolved critical blocker.
6. Recover safely when appropriate: retries, rollback, queues, circuit breakers, and compensating actions are valid when explicitly designed and observable.

## Severity

- **Critical:** active compromise, likely irreversible data loss, unauthorized disclosure, or immediate severe harm. Stop affected activity; preserve evidence; escalate.
- **High:** core requirement or security boundary fails; production change is unsafe. Block dependent stages pending resolution.
- **Medium:** material quality gap with a safe workaround or non-blocking path. Document and obtain owner acceptance.
- **Low:** minor issue that does not threaten acceptance. Track without blocking unless it accumulates.

Severity depends on likelihood, impact, exploitability, exposure, and reversibility—not on how strongly an agent feels.

## Exception record

```markdown
## EXCEPTION — [stage / issue]
- ID:
- Severity:
- Raised by:
- What failed:
- Evidence (path / command / source / timestamp):
- Root cause or uncertainty:
- Impact and affected scope:
- Safe work that may continue:
- Recovery / mitigation options:
- Recommended action and trade-offs:
- Owner and required approval:
- Status: open / mitigated / resolved / accepted
```

## Safe recovery

- Inspect before retrying operations that may have partially succeeded.
- Use bounded retries with backoff only when idempotency is established.
- Do not invent fallback values for required inputs.
- Do not perform rollback, cleanup, force-kill, migration, or destructive recovery without confirming target and authorization.
- An accepted risk is not the same as a resolved defect; record the accepting user and scope.
