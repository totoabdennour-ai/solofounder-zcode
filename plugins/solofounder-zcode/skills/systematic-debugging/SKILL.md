---
name: systematic-debugging
description: Use when diagnosing a bug, failed test, integration problem, unexpected output, or regression; follows an evidence-first root-cause process before changing code.
---

# Systematic Debugging

## Four phases

### 1. Reproduce and bound
- Capture exact expected vs actual behavior.
- Identify environment, revision, inputs, frequency, and first known failure.
- Create the smallest safe reproduction; use a disposable fixture.
- Do not reproduce destructive or production-only side effects without authorization.

### 2. Trace evidence
- Follow the execution path from entry point to failure.
- Inspect logs, state, inputs, outputs, recent diffs, and dependency boundaries.
- Form competing hypotheses and rank by evidence.
- Use binary search / targeted instrumentation only when it reduces uncertainty.
- Read `root-cause-tracing.md` for data-flow and causal tracing patterns.

### 3. Prove the root cause
- Find evidence that distinguishes the leading hypothesis from alternatives.
- Identify the earliest incorrect state or contract violation.
- Explain why the symptom follows from the cause.
- If evidence is insufficient, report uncertainty instead of guessing.

### 4. Fix and prevent recurrence
- Add a regression test reproducing the failure.
- Apply the smallest correct fix at the root cause.
- Run the focused test, neighboring tests, and relevant integration checks.
- Inspect the final diff and state remaining risks.

## Prohibited shortcuts

- Do not patch symptoms before establishing cause.
- Do not suppress exceptions or weaken validation merely to silence a test.
- Do not perform blind retries against remote systems.
- Do not replace real integrations with fake success results.
- Do not edit unrelated files during diagnosis.
