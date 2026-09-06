# isWebMCP offline checker — developer preview

Version 0.2.0. Check an HTML export locally, get source-level recommendations, and compare the next export to catch new or worsened findings. This public developer preview applies isWebMCP's existing source analyzer; it is not a hosted enterprise platform or runtime browser verifier.

## Download, extract, and run

Download the [offline-checker 0.2.0 ZIP](https://iswebmcp.com/developer-tools/iswebmcp-offline-checker-0.2.0.zip) from the [developer guide](https://iswebmcp.com/developers/offline) and extract it to a writable, trusted local folder. [Published checksums](https://iswebmcp.com/developer-tools/iswebmcp-offline-checker-0.2.0.checksums.json) support file-integrity checking, not publisher identity or a security certification. Use **Node.js 22.13 or later**. The extracted folder contains `iswebmcp-offline.mjs`, this guide, and the `examples` directory. No isWebMCP account, API key, hosted service, npm registry installation, or `npm install` is needed. The package manifest deliberately prevents accidental npm publication; the supported distribution is the ZIP.

Open a terminal in the extracted folder and run:

```sh
node iswebmcp-offline.mjs --help
node examples/run-demo.mjs
```

The demo uses only the included, owned synthetic examples. `examples/before.html` contains one unnamed search field; `examples/after.html` adds its explicit label. It audits before, fixed, and the original defect again, then verifies both comparisons. Expected output:

```text
Before: UI_ACCESSIBLE_NAMES = fail
After adding a label: UI_ACCESSIBLE_NAMES = pass
Fix comparison: exit 0; 0 new or worsened findings
Removing the label again: exit 1; 1 new problem
Results retained in ./demo-results-<unique-id>/
Runtime remains unknown. This demo verifies a source-level label change, not task success.
```

Each run creates a fresh `demo-results-*` directory in the extracted folder and retains five JSON artifacts. Running it repeatedly is safe: the demo never deletes or replaces results. Its overall exit is `0` when all assertions pass, including the intentionally failing regression comparison; an unexpected result exits `2`. No HTML is executed and no data is uploaded.

To run the included fixtures manually, first create a new `reports` folder, then use:

```sh
node iswebmcp-offline.mjs audit ./examples/before.html --app catalog-search --output ./reports/before.json
node iswebmcp-offline.mjs audit ./examples/after.html --app catalog-search --output ./reports/fixed.json
node iswebmcp-offline.mjs compare ./reports/before.json ./reports/fixed.json --output ./reports/fix-comparison.json
node iswebmcp-offline.mjs audit ./examples/before.html --app catalog-search --output ./reports/regressed.json
node iswebmcp-offline.mjs compare ./reports/fixed.json ./reports/regressed.json --output ./reports/regression-comparison.json
```

The first comparison exits `0`; the final comparison intentionally exits `1`. Outputs must be new files; the checker never overwrites an existing baseline, file, or symlink. For your own exports, choose a stable, non-sensitive identifier for the **same app and page/export scope**, not a hostname, customer name, filesystem path, URL, token, or different application. App IDs start with a lowercase letter and allow up to 64 lowercase letters, digits, underscores, and hyphens.

The HTML export must already exist on a trusted local disk. The runner does not sign in, capture a browser, run a site's JavaScript, follow links, download assets, use cookies, or provision fixes. Source recommendations tell developers what to change; developers change their application and provide a new export. A practical first check is adding an explicit label to an unnamed form field, then comparing before and after.

## What the report means

The format is `iswebmcp-provided-html/v1`, not the hosted scanner's report schema. It records `reportKind: provided_html`, `acquisition: user-supplied`, `sourceScope: provided-html-only`, a SHA-256 hash of the exact input bytes, byte count, stable app/page ID, analysis timestamp, and pinned model `provided-html-v1/source-actionability-v2.2`.

Version 0.2.0 changes the distribution label, not the scanner, schema, scoring model, or comparison policy. New reports start their limitations with “Developer preview.” The validator also accepts the exact earlier 0.1.1 limitations list with its original private-release wording. This narrow wording compatibility does not rewrite legacy reports or reinterpret their origin; arbitrary edits remain invalid.

All four applicable checks are included with stable rule IDs, status, severity, trusted finding titles, and remediation suggestions:

| Rule                        | What is assessed                                                    |
| --------------------------- | ------------------------------------------------------------------- |
| `UI_ACCESSIBLE_NAMES`       | Source heuristics for explicit form-control names                   |
| `UI_STATE_FEEDBACK`         | Source-visible status and state feedback affordances                |
| `WEBMCP_CONTRACT_PROOF`     | Source hints that still need separate contract/runtime verification |
| `EVIDENCE_RUNTIME_BOUNDARY` | Runtime evidence is explicitly unknown                              |

`TRANSPORT_HTTPS` is explicitly excluded. The source analyzer internally requires URL/HTTP arguments; their synthetic values and associated transport finding are **not evidence** and are not emitted. No score, fetched observation, HTTP status, source excerpt, HTML, filesystem path, page URL, or goal is included in default artifacts or terminal messages.

“Complete” means all applicable checks ran on the entire **provided artifact** under the fixed 2 MiB limit. It does not mean a complete page, live DOM, authenticated state, shadow DOM, or complete application was observed. The hash binds bytes at generation; it does not authenticate an origin or owner, sign a report, prevent tampering, or anonymize sensitive content. Protect reports and identifiers. Comparison validates the report format but does not reread the original exports or authenticate their declarations.

## Comparison and exit codes

Comparison fails closed unless both reports use this exact schema, known local model, fixed analysis limit, same app/page ID, canonical timestamps in chronological order, and a complete, unique four-rule inventory. Unknown, omitted, duplicate, hostile, and extra fields are rejected. Only trusted per-rule text is accepted; arbitrary supplied report text cannot be copied into a comparison. Local source bytes may change between baseline and current because that is the purpose of this workflow.

| Exit | Meaning                                                                                  |
| ---- | ---------------------------------------------------------------------------------------- |
| `0`  | Audit completed, or comparison found no new/worsened partial or failing finding          |
| `1`  | Comparison found one or more new or worsened partial/failing findings                    |
| `2`  | Invalid input, incompatible/inconclusive evidence, analysis limit, or filesystem failure |

All status/severity changes are shown. The gate treats `partial` and `fail` as problems: a new problem, `partial` becoming `fail`, or severity increasing within an existing problem triggers exit `1`. Other state changes are not hidden but are not release gates. For example, feedback changing from `pass` to `not_observed` is shown without triggering this policy; adding a WebMCP hint can introduce a `partial` unresolved contract finding. **Exit 0 does not mean all findings pass:** existing failures may remain. Missing checks are rejected, never treated as a proven fix. No score is used for gating.

## Local CI use

Supply a reviewed baseline and your new export through your own trusted local workflow. For a Linux self-hosted runner, after provisioning the reviewed bundle and creating the output directory:

```sh
set -eu
node ./checker/iswebmcp-offline.mjs audit ./exports/search.html --app catalog-search --output ./local-results/current.json
node ./checker/iswebmcp-offline.mjs compare ./reviewed-baselines/search.json ./local-results/current.json --output ./local-results/comparison.json
```

This intentionally does not fetch a baseline, invoke a remote scanner, upload artifacts, replace a baseline automatically, or change access controls. Decide how to review and retain results within your organization. Do not automatically approve a release or replace a baseline just because a comparison exits 0. An existing output from an earlier CI run causes a safe refusal: provision a fresh local output directory per run.

## Resource, file, and privacy boundaries

- Inputs are bounded, nonempty regular files, at most 2 MiB, with valid UTF-8. Binary control-byte data is refused. Reads use a bounded handle, identity/size/time checks before and after reading, and one extra byte to detect growth. Explicit URL, UNC, network-share, device, alternate-stream, symlink, and junction paths are refused.
- Analysis runs in a disposable worker with a 5-second wall-clock deadline and a 128 MiB V8 old-generation heap limit. The worker is terminated before reporting `ANALYSIS_LIMIT`; no report is created on that path. The heap limit is not total process memory: buffers/native allocations, filesystem waits, and operating-system behavior are outside it. These heuristics are not a hardened HTML parser and may produce false positives/negatives; a byte cap alone is not a CPU-time bound.
- The application performs no network calls or telemetry and never executes the supplied HTML. Filesystem paths on mapped drives, network mounts, synced folders, or an externally managed CI system can still involve other software or OS network activity. Use a trusted, non-synced local disk and OS/container egress denial when network isolation is required. “No application network calls” is not an attestation of host isolation.
- Output creation is exclusive with requested mode `0600` where supported. On Windows, verify directory ACLs; a Unix mode is not a Windows ACL guarantee. Input directories must be trusted and exports stable: best-effort path/metadata checks do not sandbox an adversarial filesystem or prevent every concurrent directory replacement. A failed output write can leave a new incomplete file; do not trust it. The runner does not delete or silently replace it.
- The tool does not provide SSO/RBAC, a hosted report history, an enterprise SLA, browser authentication, runtime task verification, automatic code changes, or certification. WebMCP remains experimental. Findings are not proof of task success, security approval, accessibility conformance, market adoption, or ROI. The frozen WRI dataset is unrelated and is never read or changed.

## Source review and tests

The runtime bundle uses Node built-ins and the existing isWebMCP scanner/scoring code, with no new third-party runtime dependency. Source files are included for review. In the development repository, using its existing development dependencies:

```sh
npx tsx --test integrations/private-runner/tests/*.test.ts
```

Tests compile a temporary standalone bundle to exercise the shipped ESM worker path and run the extracted demo repeatedly; direct `tsx` execution of `src/cli.ts` is not the supported distribution command. Synthetic owned fixtures cover actual scanner output, before/after labels, strict malicious-report validation, legacy wording compatibility, secret stripping, bounds, symlinks/junctions, concurrent file changes, exclusive writes, trapped network calls, and a timed-out hostile reference-heavy export. Neither the tests nor the runner scan a third-party site.
