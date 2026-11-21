---
name: conversation-analysis
description: Use after a substantial project or milestone has stabilized; performs a factual retrospective and proposes project-scoped lessons without silently writing shared memory.
---

# Conversation Analysis & Learning

## Preconditions

Analyze only the task history, files, test output, and review evidence actually available. Do not claim access to hidden conversations, other projects, global memory, or data not provided. Do not run after an incomplete or unstable task unless the retrospective is explicitly labeled interim.

## Dimensions

1. **Wasted work:** discarded changes, rework, avoidable retries, unnecessary questions, missed context.
2. **Alignment:** mismatched interpretations, ambiguous requirements, assumptions that changed.
3. **Exceptions:** root causes, earliest detection point, recovery effectiveness, repeated failure patterns.
4. **Roles:** value of actual delegated work, review quality, missing expertise, coordination overhead.
5. **Flow:** stage ordering, useful/unused gates, dependency mistakes, effort proportionality.
6. **Quality:** escaped defects, test gaps, unsupported completion claims, maintainability.
7. **Safety/privacy:** permission creep, prompt-injection attempts, secrets exposure, excess data retention.

## Outputs

Write `.solofounder/retrospective.md` with evidence-linked findings and 3–7 prioritized improvement actions. Update `.solofounder/artifacts.md` if new artifacts were produced.

## Learning proposal policy

- Propose only reusable, non-sensitive lessons that are supported by observed evidence.
- Store a proposal in the project-local ledger using `learning-ledger.mjs propose`.
- Include source/evidence, confidence, scope, and review-by date where relevant.
- Never store API keys, passwords, tokens, private keys, customer-identifying data, personal sensitive data, or confidential material.
- Proposals are inert until explicitly approved by a human using `learning-ledger.mjs approve`.
- Approved lessons remain project-scoped. Cross-project sharing requires a separate explicit decision and a sanitization review; do not automatically write to the user home directory.

## Quality of a lesson

A useful lesson is specific, testable, scoped, and falsifiable. Avoid generic entries such as "be more careful". Prefer "For webhook workflows, reject duplicate event IDs before invoking side-effecting nodes; verified by test X".
