# isWebMCP for VS Code

Audit any public `http://` or `https://` page for WebMCP actionability and source-level readiness from VS Code.

## Commands

- **isWebMCP: Audit Public URL** — enter a complete URL.
- **isWebMCP: Audit Selected URL** — audit a URL selected in the editor.
- **isWebMCP: Open Web Audit Lab** — open the full interactive lab.

The result is deliberately evidence-scoped. It reports what a bounded public-source fetch observed, marks partial or truncated collection, and withholds runtime conformance and lift claims until runtime or paired before/after evidence exists.

## Privacy and networking

The extension sends the URL you choose to `https://iswebmcp.com/api/integrations/scan`. The service fetches that public page and retains the normalized public origin and path plus the outcome for 90 days. It does not store URL credentials, queries, fragments, goals, fetched markup, IP addresses, or user agents in the URL-attempt analytics table. Do not submit private, authenticated, local-network, or secret-bearing URLs. You can point `iswebmcp.scanEndpoint` at a trusted compatible deployment.

## Development

Open this folder in VS Code and press `F5` to launch an Extension Development Host. Run `node tests/extension.test.cjs` for the dependency-free manifest and rendering tests.

MIT licensed. Product methodology: <https://iswebmcp.com/methodology>
