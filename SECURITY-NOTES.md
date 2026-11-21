# Security review — SoloFounder upstream and ZCode port

**Review date:** 2026-11-21  
**Upstream:** https://github.com/solofounder-ai/solofounder  
**Reviewed branch:** `main`  
**Reviewed commit:** `bb56c094ce07cceab29cda068ee3c6a95745cdee` (committed 2026-04-01T10:00:00Z)

## Executive summary

No confirmed covert credential theft or outbound data-exfiltration backdoor was identified in the executable files retrieved and reviewed. This is not a proof that the entire repository is free of malicious behavior. The upstream snapshot contains security weaknesses in its optional mockup server and a privacy/context-integrity concern in its automatic SessionStart hook. The most material exposure occurs when the original mockup server is explicitly bound to a non-loopback interface.

The ZCode port removes the original hooks and mockup server, has no MCP declaration, dependency installer, package lifecycle scripts, or automatic process launch, and adds a separate, opt-in static preview server with stricter boundaries.

## Scope and method

- Retrieved the complete recursive Git tree for `main`: 69 entries, `truncated=false`.
- Reviewed the root README, contributor guidance, package metadata, license, Claude/Cursor plugin manifests, hook configuration and hook scripts, symlink targets, and the mockup server's start/stop scripts, HTTP/WebSocket server, browser helper, frame template, and operating guide.
- The six `skills/*` symlinks point to sibling directories under `../capabilities/`; they are normal repository links, not executable payloads.
- The upstream `AGENTS.md` is a symlink to `CLAUDE.md`; it is not a file containing only the literal text `CLAUDE.md`.
- No upstream script was executed. The upstream repository was not cloned locally; not every text/documentation blob, binary asset, dependency history, Git object, or prior revision received a full manual line-by-line review. The repository's `package.json` has only name/version/type and declares no dependencies or lifecycle scripts.

This is a source review of the inspected snapshot, not a formal penetration test, reproducible build attestation, or guarantee against undiscovered issues.

## Findings

### F-01 — Unauthenticated WebSocket and event-write channel

**Severity:** Medium when the server is exposed beyond loopback; Low under its default loopback binding.

The upstream server registers a WebSocket `upgrade` handler and accepts a connection when a `Sec-WebSocket-Key` is present. The handler does not validate the request path, `Origin`, an authentication token, or client identity. Received JSON events are appended to `state/events`. The matching helper automatically reconnects and sends selection/vote/feedback/merge events.

The start script defaults to `127.0.0.1`, which reduces remote exposure by default. However, it explicitly supports `--host 0.0.0.0`, and the operating guide documents using that option in remote/containerized environments. When exposed on a reachable interface, unauthenticated clients can view previews and forge or flood events. The custom WebSocket frame decoder also lacks an explicit message-size ceiling, so a reachable client may cause excessive memory use.

**Port mitigation:** the original server and interactive event channel are excluded. The replacement supports only HTTP GET/HEAD and has no WebSocket, event storage, or write route.

### F-02 — Script injection paths in the preview origin

**Severity:** Medium; impact depends on whether untrusted generated content or filenames reach the preview directory.

The upstream browser helper writes DOM-derived text and variant identifiers with `innerHTML`. The comparison-page generator interpolates variant filenames into inline event-handler JavaScript without a context-safe encoder. Full HTML documents are also served as active HTML by the local server. If an attacker-controlled label, filename, or HTML payload reaches the preview content directory, script execution in the local preview origin is plausible.

**Port mitigation:** the replacement server uses a restrictive Content Security Policy (`script-src 'none'`, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`), does not inject helper JavaScript, and serves only a small allowlist of HTML and raster-image extensions.

### F-03 — Non-loopback binding without server-side access controls

**Severity:** Medium when explicitly configured for network access.

The upstream server binds to the `BRAINSTORM_HOST` environment value, which is passed from the script's `--host` option. The code does not add authentication or origin restrictions to compensate for a non-loopback bind. The default bind is loopback; exposure requires an explicit configuration choice or environment override.

**Port mitigation:** the replacement hard-codes `127.0.0.1`; there is no CLI option or environment variable to change the bind address.

### F-04 — Stop script trusts a PID file and caller-supplied session path

**Severity:** Low to Medium depending on who can modify the session directory or invoke the script.

The upstream stop script reads a PID from `${SESSION_DIR}/state/server.pid` and sends termination signals, including SIGKILL. It recursively removes the supplied directory if its string begins with `/tmp/`. The code does not canonicalize the path or verify that the PID belongs to the intended server before signalling it.

**Port mitigation:** the upstream start/stop scripts and PID-file lifecycle are excluded. The replacement is a foreground process stopped with Ctrl+C and does not delete files or signal a PID read from disk.

### F-05 — SessionStart hook injects cross-project user notes into model context

**Severity:** Medium privacy/context-integrity concern; no outbound exfiltration was found in the inspected hook.

The upstream hook reads `~/.solofounder/learning/insights.md` when it exists and embeds its contents in high-priority additional session context. The inspected script itself contains no HTTP client, upload request, credential scraping, or remote endpoint. However, the file may contain private details from unrelated projects or untrusted prompt-like content that is elevated into the Agent context.

**Port mitigation:** all upstream hooks are omitted. Project state stays workspace-local; the port does not automatically read a global learning file.

### F-06 — Invalid percent-encoding may terminate the upstream server process

**Severity:** Low to Medium if the server is reachable by an untrusted client.

The upstream HTTP handler calls `decodeURIComponent` on a request path without a local exception boundary. A malformed percent-encoded path can throw out of the request handler; in Node.js, an uncaught exception can terminate the process. This is a denial-of-service condition, not evidence of data theft.

**Port mitigation:** the replacement catches URI decoding errors and responds with HTTP 400.

### Informational — symlinks, dependencies, and manifests

- Six `skills/*` entries are symlinks to `../capabilities/*` directories. These are expected structural links.
- Root `AGENTS.md` is a symlink to `CLAUDE.md`.
- `package.json` declares no npm dependencies and no install/pre/postinstall scripts.
- The repository tree includes Claude/Cursor manifests and hook configuration but no upstream MCP manifest in the reviewed tree.
- The upstream MIT license is retained with attribution. The ZCode port is not endorsed by upstream.

## ZCode port changes

- Reorganized 10 skills into `skills/<name>/SKILL.md` with ZCode `name` and `description` frontmatter.
- Added a ZCode plugin manifest, marketplace entry, slash command, and read-only quality-review agent.
- Kept only the capabilities needed for the skills and optional static preview.
- Excluded all upstream hooks, the original HTTP/WebSocket mockup server, its shell lifecycle scripts, and platform-specific Claude/Cursor manifests.
- Replaced the interactive preview with a manual localhost-only static server. It serves direct-child `.html`, `.png`, `.jpg`, `.jpeg`, `.webp`, and `.gif` files; refuses symlinks and files above 2 MiB; validates the Host header; accepts GET/HEAD only; and applies a restrictive CSP.
- Added reproducible metadata/frontmatter/hash checks and a preview-server smoke/security test.

## Validation results for this port

The following were run in the build environment on 2026-11-21:

- JSON parsing for marketplace and plugin manifests: PASS.
- Ten skill frontmatter entries and directory/name correspondence: PASS.
- Absence of hooks, MCP manifest and package lifecycle manifest in the plugin: PASS.
- Node syntax check for `preview-server.mjs`: PASS.
- Preview smoke/security checks: PASS for HTML, raster image, HEAD, traversal rejection, malformed URI rejection, POST rejection, Host-header rejection, and CSP presence.
- ZCode desktop installation/runtime registration: NOT RUN. This requires the user's ZCode application.

## Residual risks and recommendations

- Review the plugin manifest and all skill/agent/command prompts before enabling; ZCode documents that enabling third-party plugins grants runnable components local Agent trust.
- Do not reintroduce upstream hooks or bind a local preview service to `0.0.0.0` without authentication, origin validation, size limits, and an explicit threat model.
- Treat project files and external research as untrusted input. Do not place secrets or unrelated project notes in generated previews.
- Re-run the included tests after modifications. Test installation and skill triggering in ZCode before calling the port production-ready.


## Approval trust boundary in v2.0.0
The workflow CLI records the approver string and scope supplied by its caller. This is an auditable, self-attested workflow gate, not cryptographic proof of human identity and not an OS authorization boundary. The engine does not execute external actions. Production systems must bind consequential approvals to an authenticated human interface or an independently controlled approval service.
