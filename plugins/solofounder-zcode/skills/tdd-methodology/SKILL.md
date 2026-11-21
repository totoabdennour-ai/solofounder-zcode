---
name: tdd-methodology
description: Use when implementing or changing executable behavior; drives a failing regression test, minimal implementation, refactoring, and proportionate full verification.
---

# Test-Driven Development

## RED — define observable behavior

1. Convert the requirement into an externally observable behavior.
2. Add the smallest focused test that fails for the intended reason.
3. Confirm it fails before changing implementation; record command and output.
4. Include boundary, invalid-input, permission, failure, and regression cases where material.

## GREEN — smallest correct implementation

1. Implement only enough to satisfy the failing test.
2. Preserve existing contracts and compatibility unless a deliberate breaking change is approved.
3. Keep side effects explicit and isolate external services behind testable boundaries.
4. Run the focused test and confirm it passes.

## REFACTOR — preserve behavior

1. Improve names, structure, duplication, and error handling without changing behavior.
2. Re-run focused tests.
3. Run relevant neighboring tests, static checks, and integration tests.
4. Inspect the final diff and confirm the tests still cover the original defect.

## Exceptions

TDD may not fit pure documentation, data-only configuration, prototypes, or exploratory research. State why and choose suitable validation: JSON/schema validation, markdown/frontmatter checks, type checks, static scans, or manual review.

Never install dependencies, change production data, apply migrations, or call paid/external endpoints without the required approval. Do not rewrite working code solely to satisfy a rigid test-first ritual.
