# Research evidence ledger

Reviewed 5 September 2026. Baseline repository revision: `55048f96d5d84d17c2a31f7689616a1ee55000c2`. This ledger describes source inspection, not a fresh test run or production verification. No raw attempt log was reopened or regenerated for the paper.

| Claim in the draft                                                           | Inspected repository evidence                                                    | Boundary                                                                   |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Evidence provenance and unknown states are explicit                          | `lib/types.ts`: EvidenceSource, FindingStatus, ImportedManifestAudit, ScanReport | Type definitions cannot prove runtime provenance                           |
| Imported manifests are not independently verified                            | `lib/types.ts`: independentlyVerified is false                                   | Structural validity does not prove behavior                                |
| Weighted estimates report coverage and unknown-component bounds              | `lib/scoring.ts`: calculateWeightedScore                                         | Bounds are not statistical confidence intervals                            |
| Replay lift and incompatible comparisons are withheld                        | `lib/scoring.ts`: calculateLift; `tests/unit/scoring.test.ts`                    | Tests were inspected, not newly executed during drafting                   |
| Shopping replay is authored and synthetic                                    | `lib/demo.ts`: DEMO_TASK, CONTROLLED_REPLAY_FACTS, replay evidenceMode           | Its timings and action counts are not agent performance measurements       |
| Current paired-run checks require common fixture and task identity           | `lib/scoring.ts`: pathsComparable                                                | No attestation of autonomous-agent execution                               |
| Current example targets document.modelContext                                | `lib/workbench.ts`: SAMPLE_BOILERPLATE                                           | Does not establish browser conformance or support across versions          |
| Reports are process-local and expire                                         | `lib/scan-store.ts`: Map storage, REPORT_TTL_MS                                  | Longitudinal durable evidence is a proposed requirement                    |
| WRI audit metadata gives 100,000 scheduled; 65,380 valid; 34,620 quarantined | `data/webmcp-index/crawl-audit.json`                                             | Existing audit classification; causal diagnosis not independently repeated |
| 36,323 scored; 1,250 embedded; status audited_partial                        | Summary before rows in `data/webmcp-index/snapshot.json`                         | Presentation subset is not a random sample                                 |
| Sampling frame is Tranco GQJJK dated 31 August 2026                          | `data/webmcp-index/tranco-source.json`                                           | Popularity proxy, not traffic or app census                                |
| Raw/derived index accounting has validation rules                            | `lib/web-index.ts`; `tests/unit/web-index.test.ts`                               | No invocation of corpus validation or rebuild performed                    |
| Security limitations are documented                                          | `docs/threat-model.md`                                                           | Documentation review is not independent security validation                |

## Evidence still needed before an empirical submission

1. Owner-confirmed authorship, affiliations, contribution statements, and venue format.
2. Frozen study protocol, estimand, inclusion/exclusion rules, task definitions, and power or precision planning.
3. Versioned browser-agent runner with independently verifiable execution traces and provider usage capture.
4. State-resettable application fixtures and independently reviewed correctness/forbidden-effect assertions.
5. Opt-in application recruitment records and a clear separation of pilot from confirmatory tasks.
6. Measured paired runs, complete failure accounting, application-cluster-aware uncertainty, and sensitivity analyses.
7. A held-out calibration study if heuristic scores are to support predictive claims.
8. Privacy review of release artifacts and confirmation of redistribution rights.
9. Independent reproduction from pinned artifacts, including exact source revisions and dependency versions.
10. Broader related-work review before making any novelty claim.

The WRI accounting is an existing audited-partial observation. All paired efficacy experiments in the paper are proposed. No performance numbers, financial savings, marketplace adoption, or user outcomes should be filled from demonstration constants or inferred from scan volume.
