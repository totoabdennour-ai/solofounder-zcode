# Contributing

1. Open an issue or describe the defect and expected behavior.
2. Keep changes scoped. Do not add auto-run hooks, external MCP servers, install scripts, or background services without a security review and explicit project decision.
3. For executable behavior, add a failing regression test before the fix where practical.
4. Run `node --test plugins/solofounder-zcode/tests/*.test.mjs`, `python tests/validate_bundle.py`, and `python tests/test_preview_server.py`.
5. Update `SECURITY-NOTES.md`, `CHANGELOG.md`, docs, and version alignment when behavior/security changes.
6. Do not store credentials, customer data, or unrelated project memory in fixtures or examples.
7. Ensure all ZCode agent frontmatter follows the current official schema and verify runtime behavior in the desktop application before claiming compatibility.
8. Bump both `.zcode-plugin/plugin.json` and `marketplace.json` versions together.
