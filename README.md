# isWebMCP

> **isWebMCP** is an evidence-based before-and-after laboratory for agent-ready web applications. It distinguishes source hints from runtime proof, maps an application's action surface, evaluates WebMCP tool contracts, and measures whether WebMCP actually improves a representative user journey.

![isWebMCP social card](public/og.png)

**Map it. Contract it. Prove it.**

- Production domain: [iswebmcp.com](https://iswebmcp.com) via Vercel GitHub deployment
- Source repository (currently private; access required): [mlmrx/iswebmcp](https://github.com/mlmrx/iswebmcp)

isWebMCP is an independent, long-term developer utility and evidence platform.
It did not participate in the WebMCP Challenge and is not a challenge submission.
The live product is deployed through the native Next.js + Vercel path.
Repository visibility is private as verified on September 5, 2026. The public website and its integration downloads do not require repository access; do not change access controls as part of maintenance.

The product answers a harder question than protocol detection: can an agent use the exposed tools successfully, safely, and with an observable improvement over the human UI path?

## What works

- **Source Opportunity Scan** performs a bounded, unauthenticated fetch of public HTML/XHTML, inventories semantic controls, and reports source evidence without executing target JavaScript. Large responses produce an explicitly partial 1 MB analysis window instead of a false unreachable error.
- **Evidence reports** keep source actionability, imported contract lint, runtime readiness, and measured WebMCP Lift separate. Every v2.1 category exposes its scoring inputs, model-input coverage, confidence, and uncertainty range.
- **Imported contract evidence** accepts a sanitized tool inventory, retains only bounded schema summaries, labels its provenance, and creates an immutable derived report.
- **Proof Lab** runs the same synthetic headset task through an accessible UI-only path and a WebMCP tool path backed by the same state and services.
- **Interactive Pattern Gallery** contains exactly 24 synthetic before/after patterns across value, contract design, security, and reliability, each with a contract, example input/result, verification seam, and human confirmation boundary.
- **Audited Index** preserves frozen WRI v1 with status `audited_partial`: 100,000 scheduled and attempted ranks, 65,380 valid collection outcomes, 34,620 quarantined scanner-infrastructure errors, and 36,323 scored rows. It is partial and uncalibrated, not a product-quality ranking, market-adoption measure, or certification.
- **Contract Workbench** provides deterministic feedback on tool names, descriptions, schemas, annotations, and source-visible state/verification signals.
- **Learning Center** publishes explainers, how-tos, architecture guides, security reviews, and testing methods with direct primary-source references.
- **WebMCP FAQ** covers fundamentals, building, testing, and security. Retained challenge references are historical context, not project participation claims.
- **WebMCP Pulse** separates WebMCP changes and vendor implementation news from the broader MCP ecosystem. RSS, sitemap, and JSON indexes are included. Historical challenge observations retain their original timestamps and distinguish registrations, projects, and eligible submissions; they are not a current count or a reason to access Devpost.
- **Exports** include normalized JSON and print-friendly reports without requiring an account.

## Measurements

| Measurement          |            Range | Available when                                                                                 |
| -------------------- | ---------------: | ---------------------------------------------------------------------------------------------- |
| Source Actionability | 0–100 + interval | Source-visible UI evidence exists                                                              |
| Contract Lint        |            0–100 | A sanitized tool definition is imported                                                        |
| Runtime Readiness    |   trial evidence | Discovery, authorization, execution, verification, recovery, and lifecycle checks are observed |
| WebMCP Lift          |        −100…+100 | Paired interactive runs use the same fixture, task, and evidence mode                          |

Source Actionability v2.1 weights semantic structure (20), accessible names (20), form clarity (20), state feedback (15), entities (15), and transport (10). Raw occurrence volume is not rewarded. Unknown model inputs widen the published interval; a truncated response makes the complete-page range 0–100 instead of manufacturing a tighter bound. This is an inspectable diagnostic heuristic, not a calibrated predictor of agent success or a cross-site ranking model. WebMCP Lift weights success (40%), action reduction (20%), elapsed reduction (15%), invalid attempts (10%), human intervention (10%), and verification (5%). Efficiency components are ignored if either journey fails.

The controlled replay is an authored teaching timeline, not a model trial. Its numeric Lift is withheld. See [methodology](docs/architecture.md) and the in-app Methodology page for the complete counting rules and limitations.

## WebMCP tool inventory

The top-level application feature-detects `document.modelContext.registerTool` and registers tools with route-aware `AbortSignal` cleanup. All handlers validate untrusted input and use the same application services as the visible UI.

| Tool                       | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `scan_public_url`          | Run a source-only public scan and open its report             |
| `get_scan_summary`         | Read scores, evidence, limitations, and recommendations       |
| `list_action_surface`      | List inferred actions and coverage classes                    |
| `get_finding_details`      | Read one finding with its supporting evidence                 |
| `search_webmcp_library`    | Find reviewed explainers, guides, and security resources      |
| `get_webmcp_resource`      | Read one resource with sections and primary references        |
| `list_mcp_updates`         | List labeled WebMCP, MCP, or challenge updates                |
| `get_challenge_pulse`      | Read archived external-event observations, not current status |
| `select_demo_mode`         | Reset and select baseline or WebMCP lab mode                  |
| `start_demo_run`           | Start the supported synthetic journey                         |
| `search_demo_products`     | Filter the synthetic catalog and update visible state         |
| `compare_demo_products`    | Compare two to four stable product IDs                        |
| `add_demo_product_to_cart` | Add a synthetic item; no purchase occurs                      |
| `finish_demo_run`          | Verify deterministic postconditions                           |
| `compare_demo_runs`        | Calculate WebMCP Lift from paired completed runs              |
| `export_current_report`    | Prepare a visible JSON or print export                        |

The three catalog tools are exposed only on the Proof Lab in WebMCP mode. Report readers remain report-route scoped. The four content and pulse tools are read-only and available across the product. The application remains fully usable when WebMCP is unavailable.

## Run locally

### Developer tools without a site installation

The [developer quickstart](https://iswebmcp.com/developers) provides a downloadable Node SDK, command-line scanner, and local GitHub Actions adapter. The archive includes source, types, tests, and setup examples; no repository access or runtime dependencies are needed. These tools compare bounded source summaries, not runtime task success.

Maintainers verify the toolkit with `npm run test:developer`, rebuild the allowlisted download with `npm run developer:package`, and check archive/source consistency with `npm run developer:check`.

The [three-track execution roadmap](docs/execution-roadmap.md) connects developer tooling, research and design-partner pilots. Toolkit 0.2 migration and source model corrections are documented in the [release notes](docs/developer-release-0.2.md).

The [automated consistency pilot](docs/research/automated-consistency/README.md) includes an executed baseline, separately recorded post-fix results and a research paper draft. These internal synthetic results are not agent-performance validation. The [partner pipeline](docs/partners/README.md) contains six researched prospects and three tailored outreach drafts; no outreach or partnership is implied. The longer-term [adoption strategy](docs/adoption-strategy.md) and [runtime evaluation methods draft](docs/research/agent-ready-web-evaluation.md) describe evidence still required.

Prerequisites: Node.js 22.13 or newer and npm.

```bash
npm ci
npm run dev
```

Open the URL printed by the development server. No environment variables, accounts, model API, or target-site credentials are required. URL-attempt persistence is disabled locally unless `DATABASE_URL` points to a trusted Postgres database.

### Quality gates

```bash
npm run typecheck
npm run lint
npm test
npm audit
npm run build
npx playwright install chromium
npx playwright test
```

Additional commands:

- `npm run format:check` checks formatting.
- `npm run format` applies the repository formatter.
- `npm run start` runs the built Next.js production server locally.
- `npm run test:e2e` combines the production build and browser suite when a build has not already been run.
- `npm run integrations:validate` checks the integration manifests and packaged extension behavior.

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, change review, and evidence requirements. The legacy `index:*` commands are not onboarding steps: WRI v1 is frozen and its collection must never be restarted or rewritten.

## Architecture

The app uses Next.js 16, React 19, TypeScript, Tailwind CSS, Zod, Vitest, and Playwright. It is deliberately account-free and deterministic.

```text
Browser UI / WebMCP tools
          │
          ├── shared scan, report, demo, scoring, content, and export services
          │
          ├── Quick Scan API ── public-source fetch boundary
          ├── versioned editorial catalog + source-attributed pulse
          │
          ├── ephemeral normalized report store
          └── 90-day sanitized URL-attempt store (Neon Postgres)
```

Detailed design is in [docs/architecture.md](docs/architecture.md). Security assumptions and abuse cases are in [docs/threat-model.md](docs/threat-model.md).
Editorial cadence, approved sources, and correction policy are in [docs/content-operations.md](docs/content-operations.md).

## Security and evidence boundaries

- The browser safely normalizes bare domains to HTTPS. The API then accepts only absolute HTTP(S) URLs, rejects credentials and nonstandard ports, checks A and AAAA records before every redirect hop, blocks private/reserved/special-purpose addresses, omits cookies and authorization, and caps time, redirects, analyzed bytes, concurrency, and rates.
- The scanner checks public A and AAAA answers before each request, but the Node `fetch` connection resolves independently. Application code therefore cannot cryptographically pin the connection to the preflight address; a deployment requiring that SSRF guarantee needs controlled address-pinned egress or equivalent network policy.
- Fetched markup is untrusted input. It is analyzed in memory, never rendered as HTML, and target HTML is not retained in reports. At most the first 1 MB is analyzed and any truncation is carried into report coverage and confidence.
- Imported manifests are user supplied and **not independently verified**. Raw defaults, examples, enums, credentials, and extension payloads are not retained.
- Report storage, rate counters, and concurrency counters are ephemeral and server-instance-local in this MVP.
- Admitted scan attempts are recorded across the web UI, native integrations, and MCP endpoint when `DATABASE_URL` is configured. Only the normalized public origin and path plus operational outcome fields are retained for 90 days; credentials, queries, fragments, goals, fetched markup, IP addresses, and user agents are excluded. Unsafe input is counted without storing its value.
- Pulse updates are original summaries with direct primary-source links. There is no runtime feed ingestion in the site and no automated Devpost scraping; the checked-in catalog is reviewed, versioned, and safely rendered as text.

Please report security issues using the process in [SECURITY.md](SECURITY.md).

## Manual WebMCP verification

The WebMCP proposal is experimental and not a W3C Standard. Browser support and APIs can change. Follow [docs/manual-webmcp-test.md](docs/manual-webmcp-test.md) in a current supported Chrome or ChatGPT browser environment, then retain the date, browser/model version, visible state, and tool trace with the release evidence.

Authoritative references:

- [WebMCP Community Group draft](https://webmachinelearning.github.io/webmcp/)
- [WebMCP specification repository](https://github.com/webmachinelearning/webmcp)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp/)
- [Web Platform Tests](https://wpt.fyi/results/webmcp)

## Deployment

The production target is native Next.js on Vercel through its GitHub integration. `vercel.json` declares the framework and otherwise leaves the build and output conventions to Vercel's zero-configuration Next.js support. Set `SITE_URL=https://iswebmcp.com` in Vercel so canonical URLs, RSS, robots, and sitemap output remain stable. There is no OpenAI Sites configuration or source remote in this repository.

## Maintainer resources

- [Manual verification checklist](docs/manual-webmcp-test.md)
- [Product demo script](docs/demo-script.md)
- [URL-attempt storage and privacy](docs/url-attempt-analytics.md)
- [Repository hygiene audit](docs/repository-hygiene.md)

Unused challenge preparation documents are isolated in [the historical archive](docs/archive/challenge/README.md). They were never submitted and are not current release instructions. No challenge judging freeze applies to this independent product; the separate WRI v1 data freeze remains in force.

## License

[MIT](LICENSE). isWebMCP is an independent project and is not an official OpenAI, Google, Microsoft, Chrome, Cloudflare, or W3C product.
