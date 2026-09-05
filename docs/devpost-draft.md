# Devpost draft

> **Superseded historical draft — September 5, 2026.** This copy was never a submission record. isWebMCP did not participate in the WebMCP Challenge and is an independent developer utility. The old visibility, submission, and freeze instructions below do not apply; retain this file only as project history. Do not access Devpost as part of maintenance. Current product and evidence policy is in [content operations](content-operations.md).

## Title

**isWebMCP — From Tools Detected to Agent Action Proven**

## Tagline

An evidence-based before-and-after laboratory that tests whether WebMCP actually makes a web journey more usable, reliable, and verifiable for agents.

## Inspiration

Protocol detection is necessary, but it is not proof. A page can mention WebMCP, register a tool, or expose a polished schema while an agent still selects the wrong action, sends invalid input, loses synchronization with the visible UI, or cannot verify success.

We wanted a developer utility that asks the next questions: **what can source and contract evidence establish, what still requires a runtime trial, and when does a paired interactive comparison support a local before-and-after measurement?**

## What it does

isWebMCP has six core evidence surfaces:

1. **Quick Scan** performs a safe, unauthenticated, source-only analysis of a public page. It maps semantic controls, accessible names, source-visible actions, feedback affordances, transport, and WebMCP hints without pretending to execute the target's JavaScript.
2. **Evidence reports** separate Source Actionability, imported Contract Lint, and observed Runtime Readiness. Every conclusion identifies whether it came from source, runtime, imported, measured, or inferred evidence. Missing proof stays “Not observed,” and numeric Lift is reserved for paired interactive runs.
3. **Before/After Proof Lab** supports the same synthetic headset-selection task through an accessible UI-only path and a structured WebMCP path. Both use the same catalog, interface, state, and business services. Seven postconditions verify the result. Its authored replay teaches the flow but is not an agent trial and receives no numeric Lift.
4. **Interactive Pattern Gallery** turns 24 synthetic workflows into explorable before/after diagrams across value, contract design, security, and reliability. Each pattern exposes its tool contract, example input/result, verification seam, and human confirmation boundary without inventing performance data.
5. **Tool Contract Workbench** deterministically reviews names, descriptions, schemas, annotations, and source-visible state/verification signals.
6. **WebMCP Readiness Index** publishes frozen WRI v1 source observations with the crawl's collection health intact: 100,000 scheduled ranks, 65,380 valid collection outcomes, and 34,620 quarantined scanner-infrastructure errors. The status is audited partial, and the heuristic is explicitly uncalibrated.

Developers can also import a sanitized tool inventory. The service rejects dangerous structure and credential-like content, retains only bounded schema summaries, labels the evidence as not independently verified, and creates an immutable derived report.

## Why WebMCP is essential

Without WebMCP, a browser agent generally infers actions from the visual interface, DOM, and accessibility tree. WebMCP lets the running top-level page expose narrow structured actions backed by its live state and application logic.

The Proof Lab makes that difference visible. In a compatible runtime, an observed agent trial can search a constrained catalog, compare stable product IDs, add a synthetic item to the visible cart, and verify the outcome. Tool calls and human controls update the same state. WebMCP Lift compares success, committed action count, elapsed time, invalid attempts, human intervention, and verification only after paired interactive runs of the same task and fixture; authored replay never qualifies.

## What people and agents do together

The developer chooses the target and task, reviews evidence, and decides which safety boundaries matter. The agent can start a scan, read a report, inspect the action surface, operate the controlled demo, and compare paired runs using isWebMCP's own twelve top-level tools. The user sees every state transition and retains control of interpretation and exports.

The site remains completely usable when WebMCP is unavailable. WebMCP augments the human experience; it does not replace it.

## How we built it

The application uses Next.js 16, React 19, TypeScript, Tailwind CSS, Base UI, Zod, Vitest, Playwright, and Vercel Functions through the GitHub deployment integration.

The scanner uses strict URL and address normalization, A/AAAA checks on every redirect hop, manual redirects, an HTML/XHTML allowlist, a bounded 1 MB analysis window, short deadlines, no credentials, and per-caller/host admission. Truncation remains visible in score coverage and confidence, and captured markup is not stored in reports. Imported manifests use iterative depth/node limits, forbidden-key checks, credential-pattern rejection, and an allowlisted normalized summary.

WebMCP tools feature-detect the experimental API, validate every runtime input, reject unknown fields, use structured expected errors, and register with route/mode-scoped `AbortSignal` cleanup.

## Challenges

The hardest design problem was evidence honesty. A public server fetch cannot see another origin's live `document.modelContext`, and imported definitions can be incomplete or false. We made evidence provenance part of the data model and UI, reserved runtime claims for supported-browser tests, and allowed score dimensions to remain unknown.

The second challenge was fair comparison. Counting every keystroke would flatter tools; counting a whole form as one action would flatter the UI. We defined one committed semantic control operation as a UI action and one registered-tool execution as a tool action, count finish/verification on both paths, and reject mixed or unmatched runs.

The third challenge was safe public fetching on a serverless runtime. isWebMCP adds DNS and redirect checks, but Node fetch resolves independently and application code cannot pin the connection to the exact preflight address. We document that residual TOCTOU risk instead of claiming an SSRF-grade guarantee; hardened deployments need controlled address-pinned egress.

## Accomplishments

- Sixteen useful, validated WebMCP tools with visible shared state and lifecycle cleanup
- Source-only scanning that does not overclaim runtime evidence
- Immutable, sanitized Contract Lint reports that do not claim runtime proof
- Interactive UI-only and tool-only journeys with observable postconditions
- A published WebMCP Lift formula for qualifying interactive pairs, with numeric results withheld from authored replay
- An audited-partial WRI v1 snapshot that preserves raw attempts and quarantines scanner outages
- Unit, integration, accessibility-oriented browser, direct tool-execution, security-regression, and build gates
- A complete manual test plan, threat model, demo script, and release checklist

## What we learned

The most valuable WebMCP tools are not one-to-one wrappers around buttons. They express bounded user goals, stable entities, explicit constraints, visible state changes, and verifiable outcomes. Tool registration is a beginning; contract quality, selection reliability, authorization, state synchronization, and postcondition proof determine whether it is actually useful.

## What's next

- A same-origin probe package that captures signed runtime evidence
- Browser/model eval suites for selection accuracy and adversarial content
- Durable report storage and globally coordinated limits
- Address-pinned outbound egress for higher-assurance scanning
- Shareable comparison bundles with release-signed provenance

## Links to insert before submission

- Live app: [Vercel production domain](https://iswebmcp.com) — verify the final deployment and public access before submission
- Repository: [private build repository](https://github.com/mlmrx/iswebmcp) — change visibility to public before submission
- Demo video: `TBD_AFTER_RECORDING`
- Frozen release tag: `TBD_AFTER_FINAL_VERIFICATION`

## Disclosure

WebMCP is an experimental browser API proposal and not a W3C Standard. isWebMCP is independent and is not an official OpenAI, Google, Microsoft, Chrome, Cloudflare, or W3C product. The controlled replay is an authored illustration: no agent trial occurs, and no numeric Lift is reported from it. WRI v1 is an uncalibrated source heuristic over an audited-partial crawl, not a ranking of product quality or live WebMCP readiness.
