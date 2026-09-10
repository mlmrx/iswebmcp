# Enterprise source-evidence pilot playbook

Reviewed September 5, 2026. An operational proposal, not a customer case study, executed agreement, service-level commitment, or evidence of enterprise adoption. isWebMCP is an independent developer utility. WebMCP remains experimental; a remote MCP integration does not establish browser WebMCP support.

## Offer and boundary

Help one application team find an actionable source-level issue, integrate one supported fix through its own review process, and compare evidence over two releases. Start with a two-week, advisory pilot on one approved public page. An enterprise name on a prospective use-case page does not authorize a scan or imply a partnership.

This phase can run with the published developer toolkit and existing CI, without a technical requirement to deploy enterprise-wide, install an agent in production, or access a private repository. The customer’s vendor, procurement, security and data-processing approvals still apply. The application owner must approve the external processing described below before any real customer target is sent. If that approval is unavailable, use an owned, sanitized fixture and label the exercise an internal rehearsal, not a customer pilot.

The deliverable is an evidence bundle and a retain/remove decision. It is not a claim that an AI agent completed a task, that an application is secure, or that a score represents business value.

## Current capabilities versus prerequisites

| Capability                          | Available now                                                                                 | Boundary or prerequisite                                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public-page source check            | Hosted bounded HTTP source scan through website, SDK/CLI, or MCP tool                         | No sign-in, browser JavaScript execution, internal network, or localhost access. Public visibility alone is not permission to test a named prospect.                                       |
| Repeatable local comparison         | Developer-kit 0.2 compares two saved summary/v2 JSON files by stable finding ID               | Same final URL, declared input context, and scoring version; complete collection and finding inventory required. Does not authenticate user-supplied files.                                |
| CI adapter                          | Committed local GitHub Actions adapter invokes the same hosted scanner and comparison logic   | Public unauthenticated deployment required. A CI runner in the customer's network does not move the scanner into that network.                                                             |
| Supported starter fixes             | Accessible-control HTML and a small read-only search-tool adapter                             | Application engineers review, integrate, test, and deploy. No general automatic remediation, backend provisioning, or guaranteed browser compatibility.                                    |
| Agent-facing integration            | Remote MCP tools for source audit, contract feedback, recipes, and supplied-report comparison | Calling the server is separate from giving an agent control of the customer's browser. Review the client's own data handling before supplying reports.                                     |
| Evidence history                    | Customer-owned JSON and CI artifacts                                                          | Interactive service report IDs are ephemeral. No durable hosted report-history, tenant isolation, role-based access, or customer-selectable retention promise.                             |
| Private or authenticated evaluation | Not part of this pilot                                                                        | Needs a separately designed execution model, scoped credentials, security review, and customer approval. Do not tunnel an internal app or strip authentication to fit this pilot.          |
| Runtime task verification           | Manual application-team tests may be retained separately                                      | isWebMCP does not currently run authorized enterprise browser journeys or prove task completion. A managed browser adapter and independent outcome checks remain a separate phase.         |
| Enterprise operations               | Existing shared service and published support channel                                         | No dedicated capacity, production SLA, DPA, data residency, SSO, or contractual security certification is offered by this playbook. If required, stop and agree those prerequisites first. |

## 1. Qualify one safe and useful task

Name an application owner, one engineer, one findings reviewer, and one evidence custodian. One person may fill multiple roles for a small pilot, but record that limitation. Select a public, read-only task such as catalog search or locating a public support article; avoid purchases, account changes, personal submissions, and administrative actions.

Before collection, complete this scope record:

- Pilot ID and status: proposed, accepted, rehearsal, running, completed, or stopped.
- Owner-approved origin and path; expected redirect destination; task and stable deployment URL.
- Approval reference, approving person, approved request budget, start/end dates, and stop contact.
- Two release identifiers and an explicit change to inspect; no promise that it will improve findings.
- Toolkit version, CI workflow location, source-analysis settings, and package provenance/checksum recorded from the current download.
- Evidence access list, storage location, retention period, deletion owner, and publication permission status.
- Known coverage risk: authentication, client-only rendering, consent interstitials, bot protection, redirects, geo/CDN variants, or unstable content.

Reject the target for this phase if useful controls appear only after sign-in or browser execution, processing approval is absent, a secret-bearing URL is necessary, or the team requires private execution or guaranteed availability. Record the reason. Do not interpret inaccessible or unobserved controls as failed runtime functionality.

Do not scan a company's domain simply because it appears in a proposed use case. Do not crawl sites, enumerate project galleries, or access Devpost. One accepted page is not permission to inspect every page or every customer on a platform.

## 2. Agree on data handling before the first request

The CLI sends the chosen URL and optional goal to `https://iswebmcp.com/api/integrations/scan`. It removes URL queries and fragments before transmission by default and does not forward browser cookies or authorization headers. `--include-query` explicitly sends a query; use it only for an approved, non-sensitive query that is necessary to select the intended page. Removing a query can change which page is tested.

Paths and goal text can themselves contain secrets, personal data, customer identifiers, or unpublished business context. Review them manually. Use public test identifiers and generic goals, not production customer examples. Do not put tokens in commands, shell history, CI variables, uploaded evidence, or tool contracts. A deterministic input fingerprint is equality metadata, not anonymization or a signature.

The current [privacy policy](https://iswebmcp.com/privacy) states that sanitized URL-attempt analytics retain the normalized origin and path, hostname, surface, timestamp, outcome, status/error information, and report ID when present for 90 days, with deletion during subsequent writes. It says optional goals and fetched markup are not stored in that analytics table; they are still processed for the scan. Interactive reports are ephemeral, and hosting/security providers may process operational metadata. Do not promise immediate deletion, zero retention, or that a customer's CI retention setting changes hosted processing.

The customer retains its own original evidence bundle. A proposed starting point is restricted pilot artifacts retained for 14 days after the closing review, but the customer must choose and approve an appropriate period. This is a proposed local-artifact policy, not a new isWebMCP retention feature. Keep evidence out of public repositories and public CI logs. Preserve originals; create a separate sanitized copy for sharing. Never rewrite the original inputs or fingerprint to make an incompatible pair pass.

## 3. Install and rehearse without a customer scan

Install the public package at an explicitly pinned version, or use the versioned ZIP and checksum linked from [Developer toolkit](https://iswebmcp.com/developers). Record the exact package version and provenance, review the source, and retain the relevant lockfile or downloaded artifact. Node 22.13 or later is required; the CLI has no runtime dependencies or build step for normal use.

```sh
npm install --save-dev @iswebmcp/developer-kit@0.2.0
npx --no-install iswebmcp --help
```

From an extracted source bundle, the equivalent local help command is:

```sh
node integrations/developer-kit/bin/iswebmcp.mjs --help
```

For CI, install the pinned npm package directly or commit reviewed copies of both `integrations/developer-kit` and `integrations/github-action` to the application repository, preserving their relative paths. Use the [adapter instructions](../../integrations/github-action/README.md), pin third-party actions to reviewed commit SHAs, set `permissions: contents: read`, and keep the initial check advisory.

Set explicit artifact access and retention in the customer's workflow. Run only after the approved deployment is ready, with serialized checks for this target. Begin with at most six deliberately initiated scans across the pilot unless the owner agrees a revised budget. This is a proposed request budget, not an API entitlement. The shared service has rate and concurrency limits; the toolkit does not retry automatically. Honor `Retry-After` and retain failed attempts rather than looping or changing identities to evade limits.

Package 0.2.0 and the matching source bundle use the current filename and describe summary/v2 as the complete finding inventory returned for its bounded source scan. Continue to check the installed manifest, lockfile, and returned `findingsCoverage`; a complete bounded inventory is not a whole-application or runtime test.

## 4. Capture a baseline and review actionability

After approval, replace the reserved example below with the agreed stable public URL. Commands are examples, not a record of execution:

```sh
node integrations/developer-kit/bin/iswebmcp.mjs scan https://public-app.example/search --output .reports/pilot-001/baseline.json
```

The CLI refuses to overwrite an existing output file. Record the deployment release, timestamp, normalized requested/final target, options, toolkit version, and response schema/model alongside the saved report. Keep baseline/current/diff paths distinct. A report's own ID is not a durable copy of its contents.

Review every finding, not only the top recommendation or score. For each stable `ruleId`, record:

| Field            | Required record                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disposition      | Accepted, rejected, or unresolved                                                                                                                                    |
| Reason           | Specific source evidence plus the reviewer’s explanation; for rejection, explain whether it is a false alarm, irrelevant, or already handled outside source coverage |
| Action           | Proposed code/configuration change, explicitly valued regression check, or no useful action                                                                          |
| Owner and effort | Reviewer, engineering owner, active minutes, and assistance minutes                                                                                                  |
| Validation       | Planned source assertion and separate functional test; “score increased” alone is insufficient                                                                       |

A useful finding must lead to a concrete, relevant action or an explicitly valued check. Agreement with a vague recommendation is not enough. Retain unresolved findings rather than removing them from a favorable denominator. Owner review establishes perceived usefulness, not independently measured diagnostic precision.

## 5. Integrate one actual supported fix

Choose a fix only after the baseline demonstrates a relevant issue. For the first source-only pilot, prefer [accessible controls](https://iswebmcp.com/developers/recipes): give an existing search input a meaningful `<label>` associated by `for`/`id`, keep the real search route and validation, and preserve keyboard submission. Do not add a duplicate or nested form, change authentication, or create a fake backend to obtain a cleaner score.

Acceptance checks for this example:

1. The code diff contains the intended label/control association and keeps unique IDs.
2. Label activation focuses the expected control; keyboard submission and empty-input behavior work in the team's browser test.
3. The real search endpoint still returns the expected results for an agreed non-sensitive test query.
4. A new source report is complete and comparable, and the relevant finding change is reviewed against the actual diff.

This is a source/UX improvement example, not an accessibility-conformance audit or proof of agent success. If the label was already correct, select another genuinely supported issue or stop for lack of fit; do not manufacture a defect.

The alternative `search-tool` recipe registers a bounded read-only search tool using the application's existing authorized search function. Treat it as a separately reviewed, experimental implementation: match the browser/API version, keep the ordinary UI, honor cancellation, limit returned fields, and test lifecycle and authorization. Unit tests with an injected model context do not establish native browser compatibility. A dynamic tool registration may not appear in the HTTP source, so a source-only comparison cannot be its runtime acceptance test.

The application owner merges and deploys the fix under normal approvals. isWebMCP does not automatically modify, provision, or deploy the application.

## 6. Compare two releases honestly

After the next approved deployment reaches the same stable URL:

```sh
node integrations/developer-kit/bin/iswebmcp.mjs scan https://public-app.example/search --output .reports/pilot-001/current.json
node integrations/developer-kit/bin/iswebmcp.mjs compare .reports/pilot-001/baseline.json .reports/pilot-001/current.json --output .reports/pilot-001/diff.json
```

Comparison is local. Both reports must be observed source reports with `iswebmcp-summary/v2`, complete untruncated collection, complete finding inventories, a matching nonempty scoring-model version, and no imported contract audit. They must match the final URL and input fingerprint, which covers normalized requested URL, final URL including any query, trimmed goal, and analysis byte limit. The current timestamp must not predate the baseline.

Different preview hostnames, a changed goal/query/redirect, legacy provenance, partial results, or scoring-version changes require an explicitly reviewed new baseline. Do not strip fields, edit dates, or reinterpret the result as a pass. Matching context does not guarantee matching page content, CDN response, geography, or session; record known deployment/response variation separately. Baseline promotion must be an explicit reviewable change, not an automatic replacement after a failed comparison.

| Exit code        | Pilot treatment                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `0` from scan    | Collection completed; failing findings may still exist.                                                                             |
| `0` from compare | No new or worsened partial/failing source finding in a comparable pair. Existing failures remain visible.                           |
| `1` from compare | Review each reported regression against the code/deployment change; keep the check advisory initially.                              |
| `2`              | Invalid input, service/collection failure, or incompatible evidence. Record an inconclusive check, never a successful release gate. |

Review `new-problem`, `status-worsened`, and `severity-increased` reasons by `ruleId`. A finding that is no longer reported is not automatically a verified fix. Retain existing failures and all failed/incompatible attempts in the pilot record. Scores do not gate this CLI and should not become a headline improvement metric.

## 7. Measure without inventing outcomes

All targets below are proposed pilot decision thresholds, not observed performance, forecasts, or commitments. Agree adjustments before collection and retain the original criteria when reporting changes.

| Measure                | Exact definition                                                                                                                              | Proposed decision signal                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Setup effort           | Active owner minutes from starting documented setup to first complete saved report; assistance and waiting time recorded separately           | Investigate onboarding if unassisted active setup exceeds 30 minutes; do not discard unsuccessful setups.                              |
| Collection reliability | Complete, nontruncated reports / all attempted scans, with rate limits, timeouts, blocked responses, and other errors separated               | Resolve repeated collection failures before considering a release gate. Small pilot counts are not an SLA estimate.                    |
| Reviewed actionability | Accepted findings with a specific action or valued check / all reviewed findings; report accepted, rejected, and unresolved counts separately | At least one independently inspectable useful action or explicitly valued regression check; no invented target percentage.             |
| Baseline comparability | Successful compatible comparisons / all attempted comparisons; report refusal reasons                                                         | At least one compatible pair over the two agreed releases. A refusal is correct behavior when inputs differ.                           |
| Source-fix evidence    | Accepted issue linked to a code diff, reviewed compatible before/after report, and stated source assertion                                    | At least one such issue if a supported fix is available; otherwise report no fix demonstrated.                                         |
| Regression usefulness  | Reported regressions reviewed as expected, false alarm, or unresolved, with intervention minutes                                              | Team finds the noise and review effort acceptable; preserve all classifications.                                                       |
| Voluntary repeat use   | Owner initiates a later check, or explicitly elects to keep the CI check after reviewing its result                                           | Explicit retain/remove/defer decision with reason. Unattended scheduled runs, URL totals, and downloads do not count as voluntary use. |

Report exact counts and case context; do not extrapolate a small pilot to millions of apps, hours saved, revenue, conversion, token savings, or causal ROI. A source fix and an ordinary browser test do not prove that an AI agent completed the task.

## 8. Close with a stop/go decision

**Continue advisory use** only if approval remains valid, evidence handling is acceptable, there is at least one useful finding or valued regression check, at least one compatible pair exists, and the owner voluntarily wants to retain it. Document outstanding failures and limits. Consider a blocking CI policy only after the team has reviewed repeatability and noise and selected a clear exception/override process.

**Stop or change scope** if the page lacks relevant public source evidence, privacy/commercial prerequisites are unresolved, useful findings do not appear, service variability prevents comparison, review cost exceeds the team's tolerance, or the owner withdraws approval. Disable any pilot-only workflow at the agreed end, retain/delete artifacts according to the approved policy, and record the result without converting it into a success story. No further scans are implied by pilot completion.

The final bundle should contain `scope.md`, installation/provenance notes, original baseline/current/diff JSON, `findings-review.csv`, an attempt/error log, the reviewed change reference, separately labeled browser-test evidence if any, and `decision.md`. These are recommended customer-owned artifacts, not files automatically generated by an enterprise dashboard. Keep originals restricted; share only a separately approved sanitized export.

## Separate phase: runtime evaluation

Begin only after explicit authorization and an appropriate browser connection/test harness exist. Agree one read-only task, starting identity/state, data snapshot, browser/API/model versions, tool availability, request budget, cancellation rules, and an independently inspectable postcondition. Start on owned fixtures before a customer workflow. Secrets stay in the approved runner, not tool descriptions, saved reports, or public traces.

Record each attempt and failure, including tool discovery, registration/lifecycle errors, authorization failures, interventions, and the verified final outcome. For any UI-versus-tool comparison, match tasks and starting conditions, retain all runs, and measure task success, elapsed time, interventions, and observed token/provider cost only when instrumented. Distinguish proposed targets from measured outcomes. This phase must not be sold as an already available one-line runtime check.

## Permission to test is not permission to publish

Record separate approvals for target inspection, code integration, retained data, logo/name use, quotes, public URLs, and exact case-study text. A pilot engineer's permission is not automatically authorization to speak for the company. Do not contact guessed addresses, send outreach, create paid accounts, accept commercial contracts, or publish customer results from this playbook alone.

Until a real pilot and publication review occur, company-specific material must say **prospective use case** or **proposed pilot**, identify assumptions, and contain no fabricated outcome metrics or endorsement. An internal owned-fixture rehearsal can be published as such after review, without attributing it to a prospective company.

Pilot records are separate from the frozen, partial, uncalibrated WRI v1 artifact. Do not rerun its collection, reinterpret attempted ranks as adoption, or borrow its counts as evidence that an enterprise pilot worked.

## Implementation references

- [Developer-kit README](../../integrations/developer-kit/README.md), [comparison implementation](../../integrations/developer-kit/index.mjs), and [CLI](../../integrations/developer-kit/bin/iswebmcp.mjs): current scan, comparison, privacy, and exit-code behavior.
- [GitHub Actions adapter](../../integrations/github-action/action.yml) and [runner](../../integrations/github-action/run.mjs): current inputs and local-toolkit execution; the adapter does not expose a query/goal override.
- [Implementation recipes](../../lib/mcp/implementation-recipes.ts): supported starting points and their explicit limits.
- [Privacy policy implementation](../../app/privacy/page.tsx) and [published policy](https://iswebmcp.com/privacy): hosted processing and retention disclosures.
- [Execution roadmap](../execution-roadmap.md) and [existing partner brief](../partners/pilot-brief.md): broader independent-work and external-dependency boundaries.
