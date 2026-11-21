---
name: mockup-server
description: Use when a user needs to inspect visual alternatives, layouts, diagrams, or static UI mockups; provides an optional manual localhost-only preview with no browser-to-agent event channel.
---

# Static Preview

The ZCode port intentionally does not ship the upstream interactive HTTP/WebSocket voting server. Use `tools/preview-server.mjs` only when a browser preview materially improves the decision.

## Safe use

1. Create a dedicated preview folder inside the current project, e.g. `.solofounder/preview/`.
2. Put only non-sensitive, self-contained static files in that folder. Do not copy credentials, customer data, internal logs, or private URLs.
3. Generate `index.html` and optional sibling PNG/JPEG/WebP/GIF images. The server blocks JavaScript and remote resources through a restrictive CSP; complex interactive prototypes may not work.
4. Start manually: `node <plugin-root>/tools/preview-server.mjs --dir .solofounder/preview`.
5. Open the printed `http://localhost:<port>/` address.
6. Stop with Ctrl+C. The server has no API for writes, voting, process control, or WebSocket messages.

## Limitations

- Bind address is hard-coded to `127.0.0.1`.
- Only direct-child allowlisted files are served; symlinks and files over 2 MiB are rejected.
- GET and HEAD only.
- No auth is provided; the listener is local-only. Do not tunnel or expose it to a LAN or public network.
- No JavaScript, remote fonts, scripts, frames, or network connections are permitted by CSP.
