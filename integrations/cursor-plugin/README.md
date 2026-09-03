# isWebMCP Cursor plugin

Agent Plugin package for Cursor. It adds the isWebMCP remote MCP server and an evidence-aware audit skill.

## Use

Install this directory as an Agent Plugin, then ask Cursor:

`Audit https://example.com for WebMCP readiness and explain what the result does not prove.`

For the editor command palette and an HTML report panel, install the sibling isWebMCP VSIX; Cursor can run compatible VS Code extensions as a separate integration surface.

The remote service fetches the public URL you choose. Do not submit private, authenticated, local-network, or secret-bearing URLs.

MIT licensed. Methodology: <https://iswebmcp.com/methodology>
