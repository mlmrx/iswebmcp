# isWebMCP offline HTML reviewer — private reviewer build

Version 0.1.1. This is a small, working local review utility, **not a publicly released enterprise platform**. It applies isWebMCP's existing source analyzer to an HTML file supplied by its owner and compares saved local findings. No account, hosted API, cloud storage, or npm installation is required by the bundled runtime.

## Run the reviewed bundle

Use Node.js 22.13 or later and the extracted private reviewer package. Run these commands from the directory containing `iswebmcp-private.mjs`:

```sh
node iswebmcp-private.mjs --help
node iswebmcp-private.mjs audit ./exports/search-before.html --app catalog-search --output ./reports/baseline.json
node iswebmcp-private.mjs audit ./exports/search-after.html --app catalog-search --output ./reports/current.json
node iswebmcp-private.mjs compare ./reports/baseline.json ./reports/current.json --output ./reports/comparison.json
```

Create the `reports` directory yourself. Outputs must be new files; the runner never overwrites an existing baseline, file, or symlink. Use a stable, non-sensitive identifier for the **same app and page/export scope**, not a hostname, customer name, filesystem path, URL, token, or different application. App IDs start with a lowercase letter and allow up to 64 lowercase letters, digits, underscores, and hyphens.

The HTML export must already exist on a trusted local disk. The runner does not sign in, capture a browser, run a site's JavaScript, follow links, download assets, use cookies, or provision fixes. Source recommendations tell developers what to change; developers change their application and provide a new export. A practical first check is adding an explicit label to an unnamed form field, then comparing before and after.

## What the report means

The format is `iswebmcp-provided-html/v1`, not the hosted scanner's report schema. It records `reportKind: provided_html`, `acquisition: user-supplied`, `sourceScope: provided-html-only`, a SHA-256 hash of the exact input bytes, byte count, stable app/page ID, analysis timestamp, and pinned model `provided-html-v1/source-actionability-v2.2`.

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
node ./reviewer/iswebmcp-private.mjs audit ./exports/search.html --app catalog-search --output ./local-results/current.json
node ./reviewer/iswebmcp-private.mjs compare ./reviewed-baselines/search.json ./local-results/current.json --output ./local-results/comparison.json
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

Tests compile a temporary standalone bundle to exercise the shipped ESM worker path; direct `tsx` execution of `src/cli.ts` is not the supported distribution command. Synthetic owned fixtures cover actual scanner output, before/after labels, strict malicious-report validation, secret stripping, bounds, symlinks/junctions, concurrent file changes, exclusive writes, trapped network calls, and a timed-out hostile reference-heavy export. Neither the tests nor the runner scan a third-party site.
