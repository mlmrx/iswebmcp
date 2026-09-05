# Research directions for an arXiv preprint

Working prospectus, 5 September 2026. The first automated pilot below has executed; the other studies remain proposals. arXiv is the intended dissemination venue; no submission or acceptance is claimed.

## Recommended first study

### Metamorphic Consistency and Failure Modes of Source-Level Web Readiness Assessment

**Question.** Does a source analyzer preserve its assessment under inert or equivalent markup changes, respond to targeted evidence removal, and retain uncertainty when runtime observations are absent?

**Why first.** We can execute this on owned synthetic strings without recruitment, external website access or model costs. A protocol-fixed 22-pair pilot has now run: seven baseline relation failures were retained, corrected in a separate scanner version, and re-evaluated in a separately recorded post-fix run. See [protocol and scope](automated-consistency/protocol.md), [baseline results](automated-consistency/results/baseline.md) and [post-fix results](automated-consistency/results/post-fix.md).

**Candidate contribution.** A transparent error taxonomy and reproducible approach to checking evidence boundaries. A small internal test suite is not automatically a novel publishable contribution. Broader held-out transformations, independently authored fixtures, comparison with relevant analyzers and human review of the exact claims remain important before submission. Passing the cases used to guide fixes is regression coverage, not independent validation.

## Later external-validity study

### Predictive Validity of Static Readiness Signals for Web-Agent Task Completion

**Question.** How well do public-source features and structural tool-contract checks predict independently verified task completion, and under which conditions do they fail?

**Candidate contribution.** An externally evaluated mapping from observable interface features to task outcomes, with explicit abstention when observations are insufficient. The scientific contribution would be evidence about predictive validity and failure modes, rather than the existence of a scanner or a new composite score. Novelty remains to be established through a systematic related-work comparison.

**Design.** Recruit opt-in, resettable applications. Define task outcomes using independent application-state assertions. Collect source features and contract features separately, then run multiple agents under pinned configurations. Hold out entire applications when fitting or calibrating a prediction model; splitting repeated trials from the same application between training and test sets would leak information. Compare against constant-rate and simple feature baselines, source-only features, contract-only features, and combined features. Report discrimination, calibration, abstention coverage, and application-clustered uncertainty. An uncalibrated diagnostic score must not be interpreted directly as a probability.

**Artifacts and outcomes.** A versioned feature/task dataset, independent evaluator, repeatable runner, and error analysis. Weak predictive performance is a legitimate possible finding. Source evidence and runtime task evidence must be paired in a new dataset; the frozen WRI corpus cannot supply the missing task-success labels.

**Current readiness.** The source scanner, summary SDK, and comparison tooling exist. A research browser runner, independent task labels, external applications, and held-out evaluation are still required. The existing paper draft is a methodological starting point, not the completed empirical article.

## Complementary studies

### Structured Tool Interfaces and Web-Agent Performance: A Controlled Study of WebMCP

Compare UI-only, tool-only, and mixed interaction under matched task state, permissions, model settings, and budgets. Prespecify verified task success as the primary outcome. Report latency, provider-measured tokens, retries, human interventions, and prohibited side effects separately. Include an information-matched ablation to distinguish the effect of tool access from additional semantic guidance in descriptions. The intended contribution is evidence about when structured interfaces help or hinder; no improvement is presumed. Requires an instrumented browser runner and paired trials.

### Detecting Web-Agent Regressions Under Interface and Tool-Contract Changes

Create controlled mutations to labels, routes, schemas, authorization state, and tool lifecycle behavior. Compare source checks, contract lint, existing UI tests, and task-level agent checks against an independently labeled regression set. Measure precision, recall, false alarms, detection delay, and evaluation cost. Separate harmless changes from true task failures. Hold out mutation families and applications to avoid tailoring the benchmark to isWebMCP rules. The intended contribution is a reproducible mutation suite and evidence about complementary detection methods. The new CI adapter is an integration mechanism, not evidence that this study is complete.

### Evidence Presentation and Developer Diagnosis of Agent-Facing Web Failures

Study whether showing a score, a specific finding, or an execution trace changes developers' diagnosis accuracy, repair correctness, time spent, and confidence calibration. Use matched tasks, counterbalanced presentation order, and independent evaluation of submitted repairs. Include cases where the tool's recommendation is wrong or evidence is incomplete to test over-reliance. Determine participant recruitment and sample size from a pilot and the chosen estimand; obtain consent and applicable institutional ethics review before collecting participant data. The intended contribution concerns human decision-making, not merely interface preference. Requires participant research beyond the current implementation.

## Positioning against related work

- [WebArena](https://arxiv.org/abs/2307.13854) studies functional web-task completion. Compare our proposed evidence-validity question with its task and evaluation design.
- [BrowserGym](https://arxiv.org/abs/2412.05467) provides an ecosystem for web-agent evaluation. Assess reuse of its interfaces and experiment infrastructure instead of claiming a new general evaluation framework solely because isWebMCP has a runner.
- [AppWorld](https://arxiv.org/abs/2407.18901) supplies an important reference for state-based evaluation and unintended changes.
- [WindTunnel](https://webmcp.com/benchmark) describes a WebMCP benchmark. Review its tasks, conditions, metrics, released artifacts, and evidence before claiming an unaddressed WebMCP benchmarking gap. Its website alone does not establish independently reproduced results.
- [WebMCP Community Group draft](https://webmachinelearning.github.io/webmcp/) defines the experimental browser mechanism. Pin a revision and distinguish it from server-side MCP integrations.

This is an initial positioning check, not a systematic literature review. A final novelty matrix must cover the closest relevant papers and available artifacts before asserting originality. All links above were checked on 5 September 2026.

## Scope of the first manuscript

Use one primary research question. Build the methods around that question, retain isWebMCP as the implementation used in the study, and report results with explicit denominators and uncertainty. Avoid combining predictive validation, causal performance measurement, mutation testing, and a developer user study into an unfocused first manuscript. The other questions can motivate separately scoped work if evidence warrants it.

Suggested structure: abstract; research question and contributions; related work; system and evidence model; study design; results; ablations and failure analysis; threats to validity; artifact availability; conclusion. Populate results only from executed experiments, and make the analysis scripts consume the released data rather than hand-entered promotional numbers. A completed methodological or theoretical contribution may support a different paper, but a plan to perform future experiments does not establish that contribution.

Keep WRI v1 in a bounded collection-accounting example or appendix. Its 100,000 attempted ranks, 65,380 valid collection outcomes, 34,620 quarantined infrastructure errors, and 36,323 scored rows remain frozen, partial, and uncalibrated. They establish neither adoption nor task-success prediction. No raw-log recollection or reinterpretation is part of these studies.

## arXiv preparation

arXiv moderates submissions for scholarly suitability; moderation is not peer review, and acceptance cannot be guaranteed. Its guidance says research proposals without original or substantive research may be declined. Our working draft is therefore not submission-ready merely because it uses academic sections or LaTeX. [arXiv moderation guidance](https://info.arxiv.org/help/moderation/index.html)

Before an empirical submission, complete the study, independently review the analysis and citations, establish the contribution relative to prior work, and package a self-contained manuscript with appropriately accessible research artifacts. Confirm human authorship, affiliations, licenses, and the best subject category for the actual contribution. Category selection and any account-specific submission requirements remain to be checked at submission time.

This prospectus and the current manuscript draft were prepared with substantial generative-AI assistance. Human authors must review and take responsibility for the text, references, methods, and conclusions. Include an accurate assistance disclosure consistent with arXiv's stated policy; AI tools are not authors. [arXiv guidance on generative-AI language tools](https://info.arxiv.org/help/moderation/index.html#policy-for-authors-use-of-generative-ai-language-tools)
