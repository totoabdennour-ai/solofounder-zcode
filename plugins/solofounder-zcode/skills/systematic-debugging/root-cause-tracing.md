# Root-Cause Tracing

Use this guide after reproduction and before changing code.

1. Start at the observed failure and trace backward through callers, transformations, state writes, and external boundaries.
2. At each boundary record the input contract, output contract, invariants, and evidence.
3. Compare a known-good path with the failing path where possible.
4. Identify the earliest point where actual state diverges from expected state.
5. Construct a minimal falsifiable hypothesis and a test that would fail if it were false.
6. Distinguish root cause, contributing condition, trigger, and symptom.
7. Fix the earliest incorrect state or contract; add a test at the boundary that regressed.

Do not equate temporal correlation with causation. A stack trace points to where an error surfaced, not necessarily where it originated.
