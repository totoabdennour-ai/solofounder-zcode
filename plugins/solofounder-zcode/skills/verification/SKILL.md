---
name: verification
description: Use before claiming any change, test, API integration, deployment, stage, or deliverable is complete; ties every claim to fresh, relevant evidence.
---

# Verification Before Completion

## Verification contract

For every material completion claim, define evidence in advance and run the relevant check after the final change. Read full output and exit code. Record skipped checks and environmental limits.

## Evidence hierarchy

1. Reproducible test or command output from the current revision
2. Authoritative system state / API response from the intended environment
3. Static analysis, schema validation, type checking, or a focused inspection
4. Human visual inspection with artifact or reproduction steps
5. Model reasoning or code inspection alone (supporting evidence only, not runtime proof)

## Match the claim to the check

| Claim | Evidence needed |
|---|---|
| Unit tests pass | Full relevant test output, exit code, failure count |
| Build succeeds | Build output from the final revision |
| Bug is fixed | Regression test reproducing the former failure |
| Integration works | Safe test across the actual integration boundary |
| Deployment succeeded | Target environment reports the intended revision/status |
| Requirement is met | Acceptance item + artifact/evidence mapping |
| Security review completed | Scope, methods, findings, and residual risks |

## Rules

- Do not infer test success from a changed file or an earlier run.
- Do not call a smoke test a full test suite.
- Do not treat lint as proof of correctness or a security audit as proof of zero vulnerabilities.
- Use disposable fixtures for tests; never mutate production data as a test.
- Do not weaken tests simply to get a green result; explain any justified test change.
- Redact secrets from logs and evidence. Avoid retaining personal/customer data.
- Re-check the final diff for unrelated changes.

## Result format

**Verified:** checks, commands, revision, exit codes, and outputs.

**Failed:** checks and diagnostic evidence.

**Skipped / unavailable:** checks not run and exact reason.

**Residual risk:** issues not covered by the evidence.

Only use "complete" when all required criteria passed and required approvals are recorded. Otherwise use "partial", "blocked", or "not verified".
