# Adoption strategy and first developer release

Working strategy, September 5, 2026. Targets below are proposed validation goals, not observed adoption or forecasts.

## Product promise

Help developers find actionable evidence about agent-facing web workflows, fix problems, and repeat checks after changes. isWebMCP is an independent long-term utility. WebMCP remains experimental, and MCP integrations are distinct from browser WebMCP implementations.

## Adoption loop

1. Inspect a public URL or supplied contract and show a specific finding, its evidence, and a fix.
2. Save the evidence, apply the fix, and compare a subsequent check under compatible conditions.
3. Add the same check to the release workflow so the developer returns when a change needs verification.
4. Introduce connected-browser evaluation for task completion, then measure paired UI/tool runs under controlled conditions.

The initial developer release covers source summaries, a Node SDK/CLI, and a GitHub Actions adapter. These checks cannot establish runtime tool success, authenticated workflow correctness, security certification, or agent efficiency. Source summary comparisons are scoped to the bounded findings returned by the existing API.

## Distribution

ChatGPT, Claude, Cursor, VS Code, and Chrome integrations are entry points to the shared evidence model. Marketplace review is separate from product usefulness; do not represent submitted extensions as approved. The SDK lets platform backends consume structured evidence. CI adapters fit existing release workflows. Future browser adapters should import observed traces with browser/API/model versions and explicit postconditions.

The first audience is teams already implementing agent interactions. Start with a small cohort before broad framework/platform distribution. Seek ten design-partner teams; aim for five verified fixes, three weekly repeat users, and two reproducible case studies. Measure apps with repeat useful checks and verified fixes. URL count, registrations, downloads, and marketplace installs are reach indicators and do not establish active adoption.

## Candidate design partners

These are prospects inferred from documented capabilities. There is no claimed partnership, endorsement, contact, or integration validation.

| Candidate                          | Documented capability                            | Proposed pilot and value                                                                                        | Dependency                                                                           |
| ---------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Browserbase / Stagehand ecosystem  | Hosted browser sessions and agent automation     | Retain source evidence alongside a consented browser trace; diagnose where discovery and task execution diverge | A browser adapter and test fixtures; current source SDK is only one input            |
| Checkly ecosystem                  | Playwright browser checks and monitoring as code | Run source checks next to an existing browser test and preserve separate results                                | A pilot team with a public staging URL; validate service limits before scheduled use |
| Small SaaS teams using those tools | Must be established individually                 | Fix one actual agent-facing task and repeat the check over two releases                                         | Owner participation and explicit task/postcondition selection                        |

Primary capability references, reviewed September 5, 2026:

- [Browserbase browser agents](https://docs.browserbase.com/use-cases/agents)
- [Stagehand repository](https://github.com/browserbase/stagehand)
- [Checkly Playwright support](https://www.checklyhq.com/docs/detect/synthetic-monitoring/browser-checks/playwright-support/)
- [Checkly monitoring guides](https://www.checklyhq.com/docs/guides/overview/)
- [Chrome WebMCP tool debugging](https://developer.chrome.com/docs/devtools/application/webmcp)

## Pilot proposal

Offer a two-week engineering pilot around one representative task. Establish current behavior, integrate a source check, fix one issue, and repeat across releases. Where a browser runner is available, record task success independently of source scores. Share only owner-approved, sanitized examples. Interview the team about time spent, false alarms, missing evidence, and whether it voluntarily retains the integration.

No outreach is sent by this plan. Candidate selection should favor accessible maintainers and teams with a concrete failure over brand size.

## Next milestones

- Validate and release the source SDK/CLI, CI adapter, and developer onboarding. Package distribution remains source-based until a registry release is explicitly configured and verified.
- Test onboarding with the first design partners; record time to first useful finding, fix verification, and repeat usage.
- Build an opt-in browser adapter with independent postconditions, lifecycle handling, and evidence export. Do not promise one-line runtime verification before it exists.
- Conduct paired experiments using the research protocol. Publish task success, latency, token consumption, interventions, failures, and uncertainty without invented ROI.
- Expand to framework templates and platform distribution after repeat use is demonstrated.

The audited WRI v1 corpus remains frozen, partial, and uncalibrated. Its scheduled attempts are not an adoption metric or product-quality ranking. New pilot results belong in separately versioned datasets.
