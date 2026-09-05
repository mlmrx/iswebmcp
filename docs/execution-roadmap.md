# Three-track execution roadmap

September 5, 2026. Working commitments and proposed validation criteria, not adoption claims. isWebMCP is an independent developer utility, not a challenge submission.

## One product loop, three complementary tracks

Give a developer an actionable finding, help them verify a fix, and let them repeat that check at release time. Research tests the trustworthiness of that evidence. Partner pilots establish whether another team finds it useful enough to keep using.

| Track    | Deliverable we can produce ourselves                                                                                        | Evidence that matters                                                                                                         | External dependency                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Platform | Dependency-free Node SDK/CLI, downloadable CI adapter, explicit comparison compatibility, onboarding and reproducible tests | A real scan, a verified source fix, a reliable regression check, downloadable artifacts that work without private repo access | Consenting teams and their workflows for actual retention and usability evidence           |
| Research | Frozen synthetic test protocol, automated scanner-consistency experiment, complete results and a methods/results draft      | Prespecified relations, reproducible outputs, retained failures, code/data provenance and bounded conclusions                 | Human author review; independent replication and broader evaluation before stronger claims |
| Partners | Verified prospect pipeline, tailored pilot brief, integration examples and ready-to-send outreach                           | Recipient-specific fit and a feasible pilot now; later, accepted pilots and retained use                                      | Owner's sending channel, recipient consent, access to their test deployment and responses  |

These tracks must share evidence rather than produce three disconnected marketing stories. A scanner failure found by research belongs in the engineering backlog. A partner's recurring problem informs the next adapter. A successful source check is not proof that an agent completed a task.

## Delivery order and acceptance checks

### 1. Make source comparisons dependable

- Compare stable rule identifiers rather than mutable titles.
- Return complete findings with explicit coverage, not an undisclosed top-N sample.
- Reject comparisons across different scan inputs, scoring versions, incomplete collection or missing provenance.
- Keep full URLs and goals out of comparison context; expose only a deterministic fingerprint. Hashes are not anonymization and saved reports should still be handled as potentially sensitive.
- Test against real scanner output, malformed summaries, renamed findings, changed goals/queries and partial evidence.
- Ship a versioned download, migration notes and checksum. Run formatting, types, lint, unit tests, dependency audit, production build and browser tests; verify connected production publication.

### 2. Run an automated consistency study

- Use owned synthetic HTML and a protocol written before the first results.
- Test whether inert changes preserve findings and targeted defects change the expected evidence.
- Save every result, including failures. Capture the unmodified scanner baseline before fixing defects.
- Keep post-fix runs separately labeled. Never replace baseline failures with a cleaner narrative.
- Draft a research report with related work, exact methods, results, limitations and reproducibility instructions. Treat arXiv as a dissemination target, not evidence of peer review or a guaranteed acceptance.

This study requires no participant recruitment or paid model calls. It tests internal consistency, not external predictive validity, security or agent task success. The frozen WRI v1 attempt log is outside this experiment and must remain untouched.

### 3. Offer a small, useful partner pilot

- Start with one public test page and one source-level problem, not a platform-wide integration commitment.
- Give the team the SDK/CI example and preserve their browser test results separately.
- Agree on an independently inspectable source fix and repeat over two releases.
- Record time to setup, actionable findings, false alarms and whether the team keeps the check. Do not invent these observations before pilots run.
- Ask permission before publishing a partner name, page, result or case study.

The pipeline and draft outreach live under `docs/partners/`. Being listed there means prospective fit, not an existing partnership. No automatic mass messaging, guessed contact addresses or unsolicited scans are part of this plan.

## Next product increments, after this release

1. **Durable evidence history:** opt-in storage, stable report IDs, retention/deletion controls, model-aware comparisons and privacy documentation. Local JSON files are not a hosted history service.
2. **Opt-in browser adapter:** explicit task and independent outcome assertions; record browser/API versions, navigation/tool lifecycle, errors and consent boundaries. Begin on owned fixtures before a partner workflow.
3. **Onboarding and reliability:** consent-aware activation/repeat-use instrumentation, rate-limit guidance, API error contract and operational measurements. URL attempts or downloads do not equal active apps.
4. **Additional ecosystem adapters:** prioritize only where a pilot demonstrates repeated use; reuse the same evidence contract rather than creating separate scoring systems for each marketplace.

## What we can finish without waiting

Implementation, test fixtures, local automated experiments, reproducibility artifacts, paper drafting, official-source prospect research and tailored outreach preparation. These do not require new permissions, paid studies or someone else's engineering team.

We cannot manufacture partner responses, author consent, marketplace approvals, real-world retention or causal ROI. Outreach delivery requires an authorized channel. Research submission requires a final human author review. Report these dependencies explicitly without holding up independent work.

## Success signals

Engineering: reproducible checks and no silent passing of incompatible evidence. Research: transparent failures and repeatable results, not a high headline score. Partners: voluntarily retained integration after an actual useful fix, not a list of logos. Longer-term adoption: active applications with repeat useful checks and independently verified improvements, not total URLs collected.
