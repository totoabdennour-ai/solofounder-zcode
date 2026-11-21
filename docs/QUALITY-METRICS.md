# Quality metrics and release gates

A score is meaningful only against a fixed task set and repeatable procedure. Do not label a version "10/10" based on subjective inspection.

## Core metrics

| Dimension | Metric | Release target |
|---|---|---|
| Workflow correctness | Invalid transitions rejected | 100% in unit tests |
| Evidence discipline | Required checks cannot pass without evidence | 100% in unit tests |
| Approval integrity | Approval gates cannot be bypassed through CLI transitions | 100% in unit tests |
| Dependency integrity | Unknown dependencies and cycles rejected | 100% in unit tests |
| Risk calibration | High/critical risk never classifies as Quick | 100% in unit tests |
| Privacy | No automatic global-memory read/write | Static review + runtime checklist |
| Plugin metadata | Manifest/marketplace versions and descriptions agree | 100% structural validation |
| Agent registration | All declared subagents have valid metadata | 100% structural validation |
| Security | No known critical/high finding remains unresolved | Independent review; not a zero-vulnerability guarantee |
| Runtime compatibility | Plugin, skills, command, subagents appear and dispatch in ZCode | Human desktop acceptance test |
| Effectiveness | Quality, task success, rework, latency, and cost vs baseline | Measured on a fixed evaluation suite |

## Evaluation protocol

1. Prepare at least 20 representative tasks: quick edits, debugging, greenfield coding, API integration, documentation, security review, data migration plan, and multi-system workflow design.
2. Run each task with the same model/tool configuration with SoloFounder disabled and enabled.
3. Blind-review outputs against the same rubric: correctness, completeness, security, maintainability, evidence, and user alignment.
4. Record task success, escaped defects, rework, number of user corrections, delegated tasks actually completed, tokens/API cost, wall-clock time, and tool failures.
5. Repeat with at least two model configurations; report confidence intervals and failure cases, not just averages.
6. Treat agent role definitions as an intervention only if ZCode actually dispatched the subagent; log dispatch evidence.
7. Do not call the result production-ready until runtime compatibility, rollback, and threat-model checks are complete.
