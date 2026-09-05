# Developer toolkit 0.2 and source model 2.2

September 5, 2026. This release changes comparison compatibility. It does not add browser execution or claim improved agent task success.

## Release comparisons

The API emits `iswebmcp-summary/v2`. Findings carry stable `ruleId` values and a complete inventory declaration. The source collector records an input fingerprint before redacting displayed queries: requested URL, final URL, query ordering, trimmed goal and collection limit must agree between runs. Missing context, partial collection, incomplete finding inventory, different models and legacy summaries cannot pass a release comparison.

The comparison distinguishes newly reported problems, worsening statuses and increased severity. Changed titles alone do not introduce a new finding. Disappearing findings are listed separately and do not prove that a defect was fixed. Passing means no new or worsened partial/failing findings under this model, not a clean application.

Fingerprint hashes are equality metadata, not signatures or anonymization. Protect saved reports. The client strips queries before sending unless explicitly opted in; fingerprints do not undo that privacy default.

## Migration

1. Download toolkit 0.2 from the developer page and replace the extracted toolkit and CI adapter together.
2. Review the source model change, run a new scan and inspect all existing findings.
3. Save an explicitly approved new baseline. Keep older reports as historical evidence; do not relabel them as v2 or edit model metadata to force a comparison.
4. Use the same URL, goal and query settings for subsequent runs.

The 0.1 archive remains a historical artifact. It is not the supported comparison client for v2. The toolkit is distributed as a ZIP, not a verified npm registry package.

## Source analysis corrections

Model `source-actionability-v2.2` excludes commented/inert-example script and structured-data evidence, excludes commented page titles, treats HTML control tag case consistently, and requires nonempty source names or resolvable text references for field naming credit. It remains a source heuristic, not an HTML rendering engine or a complete accessible-name implementation.

These corrections were motivated by seven failed relations in a 22-pair owned synthetic consistency pilot. The original results are retained separately from the post-fix run. Passing this known suite after fixing it establishes regression coverage, not independent accuracy, security, adoption, certification or predictive validity. See [the study protocol](research/automated-consistency/protocol.md) and the separate result artifacts.

The frozen audited-partial WRI v1 corpus and its scoring history are not reprocessed by this release. New source model results must not silently replace or reinterpret that historical artifact.
