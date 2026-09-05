# From Declared Tools to Verified Tasks: An Evidence Framework for Agent-Ready Web Applications

Research working draft · 5 September 2026 · version 0.1

**Status:** methods and system-description draft with an audited dataset accounting example. The proposed agent experiments have not been conducted for this paper. This document does not establish WebMCP efficacy, adoption, certification, or return on investment. Authorship, affiliations, and a submission venue remain to be confirmed by the project owner.

## Abstract

An application can expose a well-described tool yet fail to complete the user's task. Conversely, an application without detectable tool declarations in an initial HTML response may expose capabilities after navigation or authentication. We propose an evidence framework that separates source observations, declared contracts, runtime behavior, task correctness, and comparative outcomes. We describe relevant mechanisms in isWebMCP and specify a prospective paired evaluation of browser interaction and WebMCP-assisted interaction. As an accounting example, the frozen WRI v1 artifact records 100,000 scheduled and attempted ranks, 65,380 valid collection outcomes, 34,620 quarantined scanner-infrastructure collection errors, and 36,323 scored rows. These figures describe collection integrity, not the prevalence of functioning WebMCP applications. The proposed study uses independent state assertions, explicit failure denominators, repeated trials, and application-level uncertainty estimates. Its intended contribution is a reproducible method for deciding what an agent-readiness claim actually demonstrates; measured performance improvements remain an open empirical question.

## 1. Introduction

Developer utilities for agent interaction need to answer two different questions: what capabilities does an application appear to expose, and can a particular agent use them correctly? Treating the first answer as evidence for the second can produce misleading scores and premature reliability claims. A schema can describe an operation accurately while its callback uses stale state. A successful callback can return a success message while updating the wrong object. A correct single trial can be sensitive to a different route, model, session, or task paraphrase.

We define agent readiness as a property of a specified application, task, agent configuration, browser configuration, and observation period. It is not a universal scalar attached to a domain. We propose three contributions: an explicit mapping from observations to permissible claims; a frozen collection-accounting example that preserves infrastructure failures; and a prospective experimental protocol for task correctness, safety boundaries, and resource use. The contributions are methodological proposals and inspected implementation mechanisms. We make no priority or novelty claim without a broader literature review.

## 2. Technical context and related work

The WebMCP Community Group draft dated 4 September 2026 describes JavaScript tools exposed by web applications to agents. It distinguishes agents from browser-provided or browser-hosted agents, and places imperative tool execution in the target document's execution context. Its current examples use `document.modelContext`. The document explicitly states that it is neither a W3C Standard nor on the W3C Standards Track. These statements are version-specific; experiments must pin the browser and API surface. [WebMCP draft](https://webmachinelearning.github.io/webmcp/)

For an experiment, we separately record where the agent controller runs, where model inference runs, where the browser session runs, and where application code executes. Those locations are not interchangeable. A browser-hosted controller does not establish that inference is local, and a page callback may call an application backend. These are deployment facts to measure, not guarantees of the API.

MCP describes a host-client-server architecture in which a host coordinates clients and servers may be local processes or remote services. Connecting isWebMCP's MCP service to an assistant therefore does not, by itself, establish access to another application's live browser tools or authenticated session. [MCP architecture, version 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/architecture)

Chrome's February 2026 announcement describes declarative form interactions and imperative JavaScript interactions and presents expected benefits. We treat those benefits as motivation, not experimental results for isWebMCP. [Chrome early-preview announcement](https://developer.chrome.com/blog/webmcp-epp)

WebArena evaluates functional task completion in reproducible web environments, supporting the methodological choice to test outcomes rather than count actions alone. [Zhou et al., WebArena](https://arxiv.org/abs/2307.13854v4) AppWorld uses state-based tests and checks unintended changes, motivating our separate correctness and collateral-effect assertions. Neither paper measures the isWebMCP implementation or establishes WebMCP lift. [Trivedi et al., AppWorld](https://arxiv.org/abs/2407.18901v1)

## 3. Evidence framework

The following levels are proposed claim boundaries. They are not a certification scheme or a requirement to reduce all observations to one rank.

| Evidence                            | Permissible conclusion                                                            | Additional evidence needed                                |
| ----------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Public response source              | A marker or interface element was observed in a bounded response at a stated time | Runtime registration and behavior                         |
| Imported declaration or source lint | Supplied definitions satisfy specified structural checks                          | Independent provenance, authorization, execution          |
| Observed runtime invocation         | A named operation ran in a specified session and produced recorded behavior       | Whole-task correctness across trials                      |
| Independently verified task         | Required state predicates held and forbidden changes did not occur for this trial | Generalization and comparative performance                |
| Repeated paired experiment          | An estimated difference under a specified study design                            | External validity beyond sampled tasks and configurations |

Absence of source evidence means “not observed within this acquisition scope.” It does not mean “unsupported everywhere.” An infrastructure failure provides no negative evidence about the target application's capabilities. Imported claims remain attributed to their supplier even when syntactically valid.

Every experimental claim should retain the application revision, tool contract revision, task and fixture revisions, browser and agent configurations, timestamp, acquisition mode, result, and limitation. We propose recording these as a manifest alongside redacted event traces. The complete research manifest is a proposed artifact, not a claim about existing hosted report persistence.

## 4. Inspected isWebMCP mechanisms

The implementation review was anchored at repository revision `55048f96d5d84d17c2a31f7689616a1ee55000c2`. Files may change after this draft. This review did not execute browser agent trials or independently rerun a security audit.

The report types distinguish source, runtime, imported, measured, and inferred evidence. Imported manifest audits explicitly record that they are not independently verified. Source reports have a null WebMCP lift field. Weighted-score calculations expose coverage separately from the observed estimate. The associated unknown-evidence interval is a bound derived from missing components; it is not a statistical confidence interval. [Implementation evidence ledger](evidence-ledger.md)

The synthetic shopping task contains goal assertions and stops before checkout. Its controlled replay includes authored action counts and elapsed times. The lift calculation withholds a numerical result for controlled replay or incompatible paths. For interactive comparisons, it checks task, fixture, comparison identity, evidence mode, completion, required journey surface, and UI-only versus tool-only paths. These guards help reject invalid comparisons but do not authenticate that an autonomous agent performed a run. Interactive observations and unit-test fixtures must not be relabeled as independent model benchmarks.

The current composite lift weights are task success 0.40, actions 0.20, elapsed time 0.15, invalid attempts 0.10, human intervention 0.10, and verification 0.05. These are product choices rather than empirically calibrated utility weights. We therefore propose primary research reporting with separate outcome metrics. A composite can be exploratory, with its formula and sensitivity to weights published.

Inspection of report storage found process-local expiring reports. The source-audit workflow is consequently useful for immediate inspection but does not yet establish a durable longitudinal research archive. Application-owner consent, durable access-controlled evidence, model-usage capture, repeatable browser trials, and an independent outcome evaluator are prerequisites for the proposed study.

## 5. Frozen WRI v1 collection accounting

WRI v1 is an audited-partial, frozen, uncalibrated artifact. Its metadata identifies Tranco list `GQJJK`, dated 31 August 2026, as the input ranking. Tranco provides persistent list identifiers for reproducible references; popularity ranks are a sampling frame, not direct traffic measurements or a census of applications. [Tranco](https://tranco-list.eu/)

The local snapshot specifies one public homepage per ranked domain, static response source only, no JavaScript execution, login, cookies, or screenshots, and a robots exclusion check. For this draft we read the audit manifest, source metadata, and snapshot summary only. We did not reopen the raw attempt log, restart collection, rebuild the snapshot, or reinterpret its quarantines.

| Accounting category                     |   Count | Percentage of scheduled ranks |
| --------------------------------------- | ------: | ----------------------------: |
| Scheduled ranks                         | 100,000 |                       100.00% |
| Attempted ranks                         | 100,000 |                       100.00% |
| Valid collection outcomes               |  65,380 |                        65.38% |
| Quarantined collection errors           |  34,620 |                        34.62% |
| Scored rows, a subset of valid outcomes |  36,323 |                        36.32% |

The first two rows describe the same accounting universe. Valid outcomes and quarantined errors partition attempted ranks; scored rows are not an additional disjoint category. Valid collection outcomes include scored responses and recorded exclusion/failure outcomes, not only successful HTML observations. The snapshot partitions valid outcomes into 36,323 scored, 5,632 robots-blocked, 23,328 unreachable, 76 unsupported, and 21 unsafe outcomes. The arithmetic is 36,323 + 5,632 + 23,328 + 76 + 21 = 65,380.

The audit manifest records two infrastructure-failure ranges, comprising 10,624 and 23,996 rows. Its explanations reference implausibly rapid contiguous failures with no target-specific evidence. We report that existing audit classification; we did not independently establish its causal diagnosis. The summary was generated on 2 September 2026 following the audit that day. The embedded site snapshot contains 1,250 rows; that presentation subset must not be mistaken for either the scored corpus or a random sample.

These counts support a collection-integrity statement only. They do not support a WebMCP adoption rate, a complete 100,000-site observation claim, a quality leaderboard, an improvement estimate, or certification. Missingness follows contiguous collection ranges and may correlate with rank or collection time. We make no missing-at-random assumption and impute no capability for quarantined or unscored records. WRI v1 remains frozen; any future collection requires a separate version and protocol.

## 6. Proposed paired experiment

### Questions and conditions

The primary question is whether adding a WebMCP route changes independently verified task success under otherwise matched conditions. Secondary questions concern resource use, unsafe effects, and sensitivity to application changes. No direction or magnitude of effect is assumed.

Condition A provides normal browser UI interaction. Condition B provides WebMCP tools with equivalent application permissions and business logic. A separately reported condition C may permit UI and tool fallback, approximating a mixed production workflow. We do not silently combine B and C. To isolate interface effects, both routes must expose equivalent task information; any extra semantic information in a tool description is documented as part of the treatment.

Recruit opt-in application owners across several workflow types. Use resettable test tenants with synthetic data. Define tasks, independent state predicates, prohibited effects, timeouts, and budgets before looking at comparative outcomes. Pilot data may inform instrumentation and sample-size planning, but must be separated from the confirmatory evaluation. Choose the final sample size using a declared minimum meaningful success-rate difference and application-level clustering; do not present an arbitrary trial count as a power calculation.

### Procedure

For each application-task pair, reset both conditions to equivalent fixture state. Hold the agent/model version, reasoning settings, prompt, allowed information, browser version, budgets, region, and network policy constant where possible. Randomize condition order within blocks, repeat trials with fresh sessions, and record unavoidable provider nondeterminism. The agent receives task goals but no hidden evaluator answers. An independent evaluator reads authoritative application state and checks both intended and prohibited changes. Blind any necessary human adjudication to condition, and preserve disputed outcomes.

The controller must record unavailable browser APIs, expired sessions, harness failures, and target failures as different outcomes. Preregister infrastructure exclusion rules. Report the complete assigned-run flow and retain interrupted runs; do not remove hard cases after seeing a treatment result. A retry policy applies equally to conditions, and all attempts consume the recorded budget.

### Outcomes and analysis

The primary estimand is the application-macro-averaged difference in independently verified success probability between B and A for the sampled tasks and configurations. Within each application, average per-task repeated-trial success, then give each application equal weight. Report sample counts and application-specific estimates so large fixtures cannot dominate silently.

| Metric             | Definition and reporting rule                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Verified success   | All required predicates and no prohibited effects within the budget; include all assigned evaluable trials                       |
| Unsafe-effect rate | Fraction with any prespecified prohibited effect, reported regardless of task success                                            |
| Time               | End-to-end elapsed time, with timeout counts and censoring policy; successful-only comparisons are conditional secondary results |
| Usage              | Provider-reported input/output tokens and monetary cost under recorded prices; unavailable usage stays missing                   |
| Interaction        | UI actions, tool calls, invalid attempts, and human interventions, with fixed counting rules                                     |
| Stability          | Changes in verified success after controlled UI, contract, route, or session perturbations                                       |

Use paired analysis preserving task pairing and application clusters. A proposed uncertainty procedure resamples applications, then paired tasks within selected applications, to produce bootstrap intervals; repeated stochastic trials stay grouped by task. Publish resampling settings and denominators. With too few independent applications, present descriptive intervals and individual results rather than broad population inference. Prespecify the primary outcome and label secondary analyses exploratory or use a declared multiplicity adjustment.

Efficiency among pairs where both conditions succeed answers a narrower question and is vulnerable to selection. Report it alongside unconditional success and all-trial resource consumption. Token savings are not inferred from action counts. Financial ROI would require additional development, maintenance, infrastructure, and business-outcome evidence that this protocol does not provide.

## 7. Threats to validity

Construct validity depends on task predicates expressing the user's actual goal. A benchmark may miss semantic mistakes or harmful side effects. Validate predicates with application owners and independently review a held-out sample. Tool authors and evaluator authors should not share hidden answers with the agent.

Internal validity is threatened by unequal permissions, richer information in one condition, warm caches, order effects, fixture leakage, provider drift, and selectively discarded failures. Publish these differences and test information-matched ablations where feasible. The inspected composite score is uncalibrated and cannot substitute for the primary estimand.

External validity is limited by opt-in recruitment, small task families, synthetic tenants, browser support, model choice, and specification drift. A developer utility may help diagnose an application without improving an agent's task success; that is a different outcome requiring a developer study. WRI's popularity-based homepage frame does not repair these limitations and must not be pooled with the prospective experiment as if both measured the same construct.

## 8. Ethics, privacy, and artifact release

Use owned or explicitly authorized applications for interactive trials. Do not send real payments, reservations, communications, or account mutations as benchmark side effects. Constrain test identities and egress, keep secrets out of prompts and traces, and redact URL paths as well as queries when they can reveal personal data. A supplied URL is not consent to publicize its contents or a report about its owner.

Release synthetic fixtures, tool and task versions, evaluator code, aggregate outcomes, redacted traces, and a reproducibility manifest when rights permit. Record consent and retention decisions for participating teams. Do not describe available code as a complete reproducible experiment until an independent runner has reproduced the results. Existing WRI audit classifications remain preserved and clearly attributed. isWebMCP is an independent developer utility; this work claims no challenge participation or eligibility.

## 9. Discussion and next evidence

The inspected implementation demonstrates useful separations between source inspection, imported contracts, interactive observations, and authored demonstrations. The frozen accounting example demonstrates why attempted collection volume cannot stand in for valid evidence. The next empirical step is a small opt-in feasibility study that validates instrumentation and outcome predicates, followed by a preregistered paired study. Publication of a measured-efficacy paper depends on that new evidence. This working draft can presently support review of the proposed method and system boundaries.

## References

All external sources below were checked on 5 September 2026. Living documents require a pinned revision in the eventual experiment artifact.

1. Web Machine Learning Community Group. _WebMCP_. Draft Community Group Report, 4 September 2026. <https://webmachinelearning.github.io/webmcp/>
2. Model Context Protocol. _Architecture_. Specification version 2025-11-25. <https://modelcontextprotocol.io/specification/2025-11-25/architecture>
3. André Cipriani Bandarra. _WebMCP is available for early preview_. Chrome for Developers, 10 February 2026. <https://developer.chrome.com/blog/webmcp-epp>
4. Shuyan Zhou et al. _WebArena: A Realistic Web Environment for Building Autonomous Agents_. arXiv:2307.13854v4, 16 April 2024. <https://arxiv.org/abs/2307.13854v4>
5. Harsh Trivedi et al. _AppWorld: A Controllable World of Apps and People for Benchmarking Interactive Coding Agents_. arXiv:2407.18901v1, 26 July 2024. <https://arxiv.org/abs/2407.18901v1>
6. Tranco. _A research-oriented top sites ranking hardened against manipulation_. Living project documentation. <https://tranco-list.eu/>
7. isWebMCP. _WRI v1 audit manifest, source metadata, snapshot summary, and evaluation implementation_. Local artifact evidence and exact paths are recorded in [the evidence ledger](evidence-ledger.md).
