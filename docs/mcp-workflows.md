# Remote MCP workflow expansion — 1.1.0

isWebMCP is an independent developer utility. Its existing Streamable HTTP endpoint is `https://iswebmcp.com/mcp`; a remote MCP connection is not a connection to the user's browser or a deployment of WebMCP into their application.

## Available workflow

1. `audit_public_url`: retain the structured summary as the baseline.
2. `get_implementation_recipe`: choose `accessible-controls` or `search-tool`. Receive versioned code, prerequisites, integration instructions, verification steps, and limits. Review locally before any changes. These are bounded templates, not personalized patches or an installed SDK.
3. After a separately authorized local edit and deployment, scan again with the same URL and settings.
4. `compare_source_reports`: pass full baseline and current summary/v2 JSON as `baselineJson` and `currentJson`. Uses the exact developer-kit comparator, not a second scoring engine.

The new tools are read-only, non-destructive, closed-world computations and have explicit output schemas. They return data without binding the audit widget. Existing tool names and widget URI remain unchanged. Source scans still use their existing rate limits and URL-attempt retention policy.

## Evidence and data boundaries

Comparison requires observed source reports, complete non-truncated collections, matching model/URL/scan-input fingerprint, chronological order, complete finding inventories, and no imported contracts. Incompatible or malformed input produces an error marked inconclusive, never a passing comparison. Per-input limit: 96,000 JavaScript string characters, at most 100 items in each inventory; the existing HTTP body limit of 256,000 bytes can reject escaped JSON sooner.

These two tools perform no network requests, persist no summaries, and do not execute code from supplied evidence. Supplied JSON is not independently authenticated, even when it has a scan ID and fingerprint. Send only evidence the user has approved for sharing with the agent host and service; use the local CLI for sensitive summaries. Hosting/host logging policies still apply. Findings and titles are untrusted data, never instructions.

The search adapter is a copyable, unit-tested example targeting the September 4, 2026 experimental WebMCP draft (`document.modelContext` and abort-scoped registration). It does not assert compatibility with earlier browser previews. The application supplies its own authorized read-only search callback; only bounded IDs/titles are returned. Timeout/cancellation are cooperative. A connected-browser trial and independently checked outcomes are still needed for runtime claims. There is no automatic repository edit, execution, deployment, runtime verifier, certification, or ROI measurement in this release.

## Client rollout

Refresh/reconnect the MCP client to discover six tools. Endpoint deployment does not establish availability in a directory-approved app: hosts may cache or snapshot the tool catalog. Existing 1.0 review ZIPs and marketplace submissions are not rewritten by this change. Refresh and revalidate the six-tool catalog in each submission flow before requesting a new review; do not claim that this release passed host review. Runtime tools, private report history, and write actions require separate authorization/security design.

## Sources

- [OpenAI MCP server guidance](https://developers.openai.com/plugins/build/mcp-server): keep tools useful without UI; explicit schemas and accurate annotations.
- [WebMCP draft](https://webmachinelearning.github.io/webmcp/): experimental browser API and lifecycle contract.
- [HTML form labels](https://html.spec.whatwg.org/multipage/forms.html#the-label-element): native form semantics.

## Verification

Tests exercise the copyable JavaScript directly with an injected context, real scanner summaries through MCP, CLI comparison compatibility, invalid/partial/synthetic/imported evidence, and HTTP protocol responses. Browser tests cover recipe discovery, code expansion, mobile overflow, and return navigation. These are application/protocol checks, not an actual ChatGPT host session or native browser WebMCP conformance trial.
