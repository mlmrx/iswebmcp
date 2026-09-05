# Metamorphic Consistency Checks for Source-Based Agent-Readiness Assessment: An Internal Synthetic Pilot

Status: working research draft with executed pilot results, September 5, 2026. Author names, affiliations, and a public artifact location remain to be supplied by the owner. This is not submitted, peer reviewed, or a claim of novelty. The study evaluates isWebMCP's source analyzer, not the effectiveness of WebMCP agents.

## Abstract

Source-based assessments can produce misleading evidence when non-executing markup is mistaken for an active interface or when equivalent HTML changes output metadata. We constructed 22 paired synthetic cases spanning inert markup, duplication, representation, accessible naming, intended sensitivity, and evidence boundaries. Each case declares an expected relation and its assumptions before execution. A deterministic local harness executed the current isWebMCP analyzer without network collection, model calls, or human participants. Fifteen relations held and seven failed. Observed failures included tool hints inferred from commented or inert template scripts, score increases from commented document metadata, case-sensitive confidence assignment, and full field-name credit for empty labels or unresolved references. Passing cases included the three declared evidence boundaries and duplicate-signal checks. These findings motivate specific analyzer corrections and a broader independent evaluation. The small white-box, purposively selected suite does not estimate real-world failure prevalence, predict agent task completion, or establish accessibility conformance.

## 1. Research question and scope

RQ: Does a source-only assessment preserve declared invariances, respond to controlled evidence removal or addition, and retain uncertainty boundaries on owned synthetic inputs?

isWebMCP extracts action candidates, source hints, category scores, and limitations from HTML. Its baseline model identifies itself as `source-actionability-v2.1`. It does not execute the input application. We therefore evaluate consistency of the reported source evidence rather than successful registration, authorization, task execution, or end-user benefit. WebMCP remains experimental; the study does not establish its deployment readiness.

The useful output is a reproducible set of counterexamples and preserved observations. The present contribution is an internal engineering pilot applying established testing methods to one implementation. Research novelty and generality have not been established; additional related-work review and independent systems would be needed before a broader scientific claim.

## 2. Method and relation design

Metamorphic testing checks expected relationships across source and transformed inputs rather than requiring a complete expected output for every input. The original technical report describes deriving new test cases from existing successful cases [1]; subsequent empirical work studies its fault-detection effectiveness [2]. We apply that established approach, with hand-authored relations rather than a learned oracle.

The case catalog and protocol were written before the first execution but after reading the scanner implementation and existing tests. This is explicitly white-box exploratory work, not preregistered confirmatory research. Six families cover 22 paired cases:

| Family               | Pairs | Declared expectation                                                                                                        |
| -------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------- |
| Inert markup         |     6 | Comments, uninstantiated template content, and escaped code examples do not create active semantic evidence.                |
| Duplication          |     3 | Repeating existing signals can change raw counts without increasing semantic diversity points.                              |
| Representation       |     4 | Equivalent attribute order, tag case, action order, and entity encoding preserve the normalized assessment.                 |
| Naming               |     4 | Removing valid names reduces field-name points; restoring a name increases them. Empty or unresolved names lose credit.     |
| Intended sensitivity |     2 | A status region adds feedback evidence; an unencrypted entry hop reduces transport evidence.                                |
| Evidence boundaries  |     3 | Registration stays a hint, truncated input retains uncertainty, and a requested goal cannot increase source-derived points. |

Each relation states a local assumption. In particular, template fixtures contain no instantiation code; template contents are a separate fragment under HTML processing [3]. Label fixtures have no alternate naming fallback; the naming expectations concern these simple cases and do not implement the complete accessible-name computation [4]. Duplication is not asserted to preserve every real task's semantics: the checks target the scanner's explicit distinct-signal scoring choices. Representation comparisons sort independently named action sets, intentionally excluding sequence.

All inputs are owned HTML strings associated with a reserved `.invalid` URL. The analyzer is called directly; no URL is fetched. The harness fixes the analyzer date, calculates UTF-8 byte lengths, and projects meaningful outputs while excluding random report IDs. It retains action confidence and risk, category metric points, coverage, implementation classification, findings, and uncertainty. Source files, the executable catalog, protocol, runner, dependency lockfile, and every fixture are SHA-256 identified. A separate run manifest records actual execution time, Node version, and Git base. Git base is not substituted for working-tree source hashes.

The captured run used Node 22.16.0. Every pair produced an analyzable result; there were no collection exceptions. Six harness tests passed, including negative oracle controls, deterministic replay, fixture hash validation, and output-directory containment. The denominator of 22 refers to paired relations, not independently sampled applications. Many before-inputs are intentionally shared.

## 3. Observed baseline results

The first run recorded 15 passing and seven failing relations. All are retained in `results/baseline.json`; `results/baseline.md` provides the full case inventory.

| Family               | Passed | Failed |
| -------------------- | -----: | -----: |
| Inert markup         |      2 |      4 |
| Duplication          |      3 |      0 |
| Representation       |      3 |      1 |
| Naming               |      2 |      2 |
| Intended sensitivity |      2 |      0 |
| Evidence boundaries  |      3 |      0 |

Seven observed relation violations were:

1. A registration-like script inside an HTML comment changed implementation classification from no detected hint to a detected source hint. The aggregate source score stayed 67.
2. The same registration-like script inside an uninstantiated template caused the same classification change, again without changing the aggregate score.
3. A commented JSON-LD block increased the score from 67 to 71 and was counted as structured data.
4. A commented title increased the score from 65 to 67 by contributing page-identity evidence.
5. Changing `button` tag spelling to uppercase preserved the score of 46 but changed the action's UI confidence from high to medium.
6. Replacing a field's sole nonempty label with an empty associated label left field-name credit at 55 of 55 and the aggregate score at 67, contrary to the declared decrease.
7. Replacing a valid `aria-labelledby` reference with an unresolved reference left field-name credit at 55 of 55 and the aggregate score at 49.

These are failures of the declared relations, not seven statistically independent root causes. Source inspection supports three implementation-level explanations: raw-HTML metadata/script extraction bypasses inert-content filtering; action confidence uses a case-sensitive tag-prefix check; and name detection credits attribute/relationship presence without establishing nonempty referenced text. These explanations are hypotheses grounded in code and the counterexamples, rather than a separate causal experiment across alternative parsers.

Passing observations also matter. Repeated buttons, status regions, and JSON-LD did not inflate the tested score components. Ordinary label removal and restoration were detected. The tested inline-registration case did not acquire runtime quality or lift. The truncated case retained its prefix estimate, lowered confidence, and exposed a 0–100 full-page interval. User-supplied goals did not raise the source score. These are narrowly scoped observations, not proof that all such cases are handled.

## 4. Implications for the platform

### 4.1 Intervention replay (separate from baseline)

After recording the baseline, the platform implementation was corrected without changing the catalog, relation predicates, or protocol. A separately recorded run of `source-actionability-v2.2` satisfied all 22 relations (zero failures); see `results/post-fix.json` and its run manifest. The source-hash comparison shows that only `lib/scanner.ts` changed among the eight tracked files. The seven formerly failing pairs passed and the 15 previously passing pairs still passed.

This is a targeted intervention evaluated on the same disclosed cases, not held-out validation. It demonstrates resolution of these counterexamples under the recorded assumptions; it does not show generalization. Baseline results remain unchanged and visible. The Git base contains the baseline scanner; the initial working-tree type file differs from that base, so full source hashes, not just the commit, are required for exact reproduction.

The pilot distinguishes a useful source heuristic from a verified runtime result. A scanner can maintain uncertainty disclaimers while still misclassifying specific evidence. The counterexamples justify reviewing shared HTML context handling, confidence normalization, and source-name resolution. A source fix should be evaluated against a separately named result artifact; the baseline must remain intact.

Passing this suite after corrections would establish only that these 22 declared relations hold for the corrected version. It would not calibrate the score against agent success, demonstrate broad robustness, or support a market-facing quality certification. Held-out fixtures, an independently implemented DOM-based oracle, additional analyzers, and tasks with observable outcomes remain separate future studies.

## 5. Threats to validity and limitations

- **Selection and author bias:** one product's developers selected cases after implementation review. There is no random population sample, blinded evaluation, or external relation review.
- **Construct validity:** score consistency is not accessible-name conformance or agent task success. The project's weighted score remains uncalibrated.
- **Oracle assumptions:** relations reflect explicit expectations for simple fixtures. Template activation, JavaScript strings, CSS visibility, malformed HTML recovery, and alternative accessible names need more nuanced treatment.
- **Dependence:** cases share inputs, extraction logic, and relation families; failure fractions are suite descriptions only. No population intervals or significance tests are reported.
- **Coverage:** one analyzer version and one local runtime were exercised, with no browser execution, multilingual corpus, shadow DOM, authenticated app state, network acquisition, or models.
- **Reproducibility versus access:** hashes and local files identify the artifact, but public availability is not claimed until a reachable repository or archive is verified.

The one-time WRI v1 log was not accessed or modified. This synthetic dataset is separate and supplies no revised interpretation of WRI v1.

## 6. Next research steps

Review the relations independently, validate the simple DOM/naming assumptions against an isolated browser or standards-based oracle, add held-out fixtures before further implementation tuning, and compare multiple assessors with explicit decision rules. These additions can support a stronger paper. The present draft contains real internal results but should not yet be positioned as a broad benchmark or evidence of improved agent performance.

## Generative-AI assistance and author responsibility

Generative AI was used substantially in this work: to inspect the implementation, propose and encode metamorphic relations, implement the experiment harness and provenance tools, interpret observed failures, suggest scanner corrections, and draft this manuscript. Experiment results come from executed local software rather than generated measurements. AI assistance does not provide independent review or validate the research claims. Human authors must review the relation assumptions, source citations, code, actual artifacts, and conclusions, determine authorship and affiliations, and take responsibility for the accuracy and integrity of any submitted version. No human-author sign-off or submission is claimed by this working draft. This disclosure should be retained and refined to match the eventual contribution record.

## References

1. T. Y. Chen, S. C. Cheung, and S. M. Yiu. _Metamorphic Testing: A New Approach for Generating Next Test Cases_. HKUST-CS98-01, 1998. [Author-deposited copy, uploaded 2020](https://arxiv.org/abs/2002.12543).
2. H. Liu, F.-C. Kuo, D. Towey, and T. Y. Chen. _How Effectively Does Metamorphic Testing Alleviate the Oracle Problem?_ IEEE Transactions on Software Engineering 40(1), 4–22, 2014. [DOI](https://doi.org/10.1109/TSE.2013.46); [institutional record](https://vuir.vu.edu.au/33046/).
3. WHATWG. _HTML Living Standard: The template element_. [Specification](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element). Accessed September 5, 2026.
4. W3C. _Accessible Name and Description Computation 1.2: Computation steps_. [Specification](https://www.w3.org/TR/accname-1.2/#computation-steps). Accessed September 5, 2026.
