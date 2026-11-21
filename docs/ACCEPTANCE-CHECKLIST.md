# ZCode Runtime Acceptance Checklist

This checklist must be completed in the ZCode desktop application. Repository tests cannot prove UI discovery or Agent dispatch.

- [ ] Add this repository as a Personal marketplace.
- [ ] Marketplace validates without errors.
- [ ] Plugin `solofounder-zcode` appears and reports the same version as `marketplace.json` and `.zcode-plugin/plugin.json`.
- [ ] Exactly the expected 10 skills appear under the plugin; each has valid `name` / `description` metadata.
- [ ] `/solofounder` appears in the command picker and `$using-solofounder` can be invoked.
- [ ] All six subagents appear under Plugin subagents.
- [ ] Read-only agents cannot edit files or run terminal commands.
- [ ] Implementation/test agents receive only the intended workspace scope and permissions.
- [ ] Agent can actually dispatch one named subagent; confirm by observing the task result, not merely the agent definition file.
- [ ] Agent can operate the flow engine from a workspace terminal and create `.solofounder/flow.json`.
- [ ] Engine refuses stage approval when any required check is pending or lacks evidence.
- [ ] Engine refuses stage start before required plan approval or dependency completion.
- [ ] Project learning proposal remains pending until a person explicitly approves it.
- [ ] No hooks or MCP servers are registered by this plugin.
- [ ] Optional preview starts only when manually launched and binds to loopback.
- [ ] Disable/uninstall the plugin and verify its components are removed from the active workspace.

Record ZCode version, OS, plugin version, date, test operator, and any diagnostic output. A check marked incomplete means runtime compatibility remains unverified.
