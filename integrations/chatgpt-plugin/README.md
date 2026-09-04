# isWebMCP for ChatGPT

This package contains the review and testing artifacts for connecting ChatGPT to the production isWebMCP remote MCP server.

## Connect for development

Use the public MCP endpoint:

`https://iswebmcp.com/mcp`

The server exposes a bounded public-source audit, a synthetic sample, imported contract analysis, and evidence-level explanations. Audit results render in a compact MCP App UI. The public audit tool is read-only but open-world because it retrieves the user-supplied public URL.

## Submission artifacts

- `submission-draft.json` — product metadata and review notes.
- `test-prompts.md` — positive, boundary, and negative prompts.
- `review-checklist.md` — operational and policy preflight.

Before marketplace submission, replace every `OWNER_INPUT_REQUIRED` field with verified owner information and run the listed prompts against the deployed production connector.

- Privacy: <https://iswebmcp.com/privacy>
- Terms: <https://iswebmcp.com/terms>
- Support: <https://iswebmcp.com/support>
- Methodology: <https://iswebmcp.com/methodology>
