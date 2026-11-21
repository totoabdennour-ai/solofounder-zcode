# SoloFounder for ZCode — 2.0.0

A safety-oriented, adaptive project-orchestration plugin for ZCode Agent. This community-maintained adaptation is based on the MIT-licensed [SoloFounder project](https://github.com/solofounder-ai/solofounder).

> **Honest status:** 2.0.0 adds an executable local workflow/evidence state engine, a human-approved project learning ledger, ZCode-registered specialist subagents, adaptive complexity rules, and security hardening. Local tests are reproducible. Installation and runtime behavior inside the ZCode desktop application still require an in-app acceptance test; this repository does not claim a verified 10/10 or production certification.

## What changed in 2.0.0

- Adaptive Quick / Standard / Complex workflow selection with risk floors.
- Actual ZCode plugin subagents: architect, research analyst, implementation engineer, test engineer, security reviewer, and independent quality reviewer.
- A Node.js built-in workflow engine with dependency checks, stage transitions, evidence-backed acceptance checks, human approvals, blockers, and audit history.
- A project-scoped learning ledger: entries remain proposals until a human approves them; no automatic global memory import/write.
- More realistic exception handling: retries and recovery are allowed when safe, bounded, and observable; Critical/High blockers stop affected work.
- The manual localhost-only static preview helper remains optional. Upstream hooks and the upstream interactive HTTP/WebSocket mockup server remain excluded.
- No npm dependencies, no install scripts, no hooks, and no MCP endpoints.

## Install

1. Open a ZCode workspace.
2. Go to **Settings → Plugins → Create → Add marketplace**.
3. Add `https://github.com/totoabdennour-ai/solofounder-zcode`.
4. Install and enable `solofounder-zcode` from the Personal marketplace.
5. Refresh the marketplace after updates and verify the plugin version and subagents in Settings.
6. Start a new ZCode session after installing/updating; custom subagent changes require a new session.

ZCode reads plugin manifests from `.zcode-plugin/plugin.json`, skills from `skills/<name>/SKILL.md`, commands from `commands/*.md`, and subagents from `agents/*.md`. See [ZCode's Plugin documentation](https://zcode.z.ai/en/docs/plugin), [Skill documentation](https://zcode.z.ai/en/docs/skill), and [Subagents documentation](https://zcode.z.ai/en/docs/subagents).

## Use

- `/solofounder Build a small internal tool to track project tasks.`
- `$using-solofounder Resume the current approved project flow.`
- `$flow-composer Create a Complex workflow for a multi-system integration.`
- `$verification Verify the final change and list evidence and gaps.`

## Workflow engine

Node.js 18+; zero third-party packages. The default state file is `.solofounder/flow.json`.

```bash
node plugins/solofounder-zcode/tools/flow-engine.mjs init --goal "Build an internal dashboard" --complexity auto --risk moderate
node plugins/solofounder-zcode/tools/flow-engine.mjs status
node plugins/solofounder-zcode/tools/flow-engine.mjs approve-plan --by "Project owner"
node plugins/solofounder-zcode/tools/flow-engine.mjs start-stage --stage discover-plan
node plugins/solofounder-zcode/tools/flow-engine.mjs record-check --stage discover-plan --check scope --status passed --evidence "Reviewed requirements: .solofounder/requirements.md"
node plugins/solofounder-zcode/tools/flow-engine.mjs record-check --stage discover-plan --check plan --status passed --evidence "Plan reviewed: .solofounder/flow.md"
node plugins/solofounder-zcode/tools/flow-engine.mjs approve-stage --stage discover-plan --by "Project owner"
node plugins/solofounder-zcode/tools/flow-engine.mjs validate
```

External side effects can be registered, approved for an exact target/scope, completed with evidence, denied, or cancelled. They remain separate from plan approval.

**Approval trust boundary:** the local CLI records an approver name and scope as an auditable, self-attested workflow decision. It is not a cryptographic identity check or an OS permission boundary. The engine does not execute approved external actions; it only records approval/completion evidence. For production deployment, bind approvals to an authenticated human UI or a separately controlled approval service.

Commands that change state are explicit. Stage approval is rejected until every required check is passed with evidence. The workflow engine does not run commands, invoke agents, access a network, or make external changes by itself.

## Project-scoped learning

```bash
node plugins/solofounder-zcode/tools/learning-ledger.mjs propose --text "Reject duplicate webhook event IDs before side effects." --source "Regression test tests/webhooks.test.mjs" --confidence 0.9
node plugins/solofounder-zcode/tools/learning-ledger.mjs list
# Human reviews the item, then explicitly approves it:
node plugins/solofounder-zcode/tools/learning-ledger.mjs approve --id <uuid> --by "Project owner"
```

Default file: `.solofounder/learning/ledger.jsonl`. This is not global memory and is never loaded from another project automatically. Secret-like strings are rejected by a basic pattern check; do not treat that check as full DLP.

## Optional static preview

```bash
node plugins/solofounder-zcode/tools/preview-server.mjs --dir .solofounder/preview
```

The helper is manual, binds only to `127.0.0.1`, serves direct-child allowlisted static files, accepts GET/HEAD, and blocks JavaScript/remote resources with CSP. It has no WebSocket, event-writing, or process-control endpoint. Do not expose it through a tunnel or LAN.

## Verify locally

```bash
node --test plugins/solofounder-zcode/tests/*.test.mjs
python tests/validate_bundle.py
python tests/test_preview_server.py
```

No claim of installation success in ZCode is made until a human checks the plugin, skills, commands, and subagents in the desktop UI. See [docs/ACCEPTANCE-CHECKLIST.md](docs/ACCEPTANCE-CHECKLIST.md), [SECURITY-NOTES.md](SECURITY-NOTES.md), and [CHANGELOG.md](CHANGELOG.md).

## Attribution / license

MIT. See [NOTICE.md](NOTICE.md) and [LICENSE](LICENSE). This project is an independent community adaptation, not an official upstream release.
