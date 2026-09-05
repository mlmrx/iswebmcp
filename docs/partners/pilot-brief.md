# A source-evidence pilot across two releases

Proposal reviewed September 5, 2026. This is an offer to discuss, not an executed partner agreement. Proposed duration: two weeks after an application owner accepts the scope. Any paid provider usage or commercial terms must be settled before it is incurred.

## Question

Does a repeatable source check give an application team actionable information about agent-facing controls or tool declarations that it wants to keep in its release workflow?

## What the team receives

One working SDK/CLI or CI example, a baseline source report, a reviewed set of findings, a comparison after a change, and a short record of limitations and next steps. The implementation should be removable without changing the application's runtime behavior. The [developer quickstart](https://iswebmcp.com/developers) provides the current distribution path; anonymous access to the private GitHub repository must not be required.

The existing service inspects bounded source evidence. It does not establish authenticated workflow correctness, task completion, security certification, or ROI. WebMCP is experimental; an MCP integration is not evidence of browser WebMCP support.

## Scope

Choose one owner-approved public page with a meaningful action and source that the current scanner can observe. Include a baseline release and one later release, with a recorded change to review. Start with an advisory CI result. Establish repeatability and useful findings before considering a blocking release gate.

No existing WebMCP implementation is required for an initial source audit. If a page depends entirely on authentication or client rendering, record it as outside current source coverage and select a suitable fixture; do not label missing source evidence as proof that the app lacks working controls.

## Work sequence

1. Qualify the task, URL, access boundary, API limits, package installation path, and CI artifact retention. Confirm who can judge whether a finding is useful.
2. Run a baseline and preserve the report, scanner/API compatibility information, time, and target release. Review every reported finding as accepted, rejected, or unresolved with a short reason.
3. Let the application owner choose a fix. Record what changed; repeat the source check under compatible conditions. A resolved source finding is evidence of a source change, not proof of task success.
4. Run against the next agreed release. Review noise and installation/support effort. Ask whether the owner chooses to retain the integration and why.

## Measures

| Signal              | Definition                                                                                               | Interpretation                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Setup effort        | Active minutes from starting documented installation to first valid report; record assistance separately | Onboarding friction, not an installation-time guarantee                             |
| Valid collection    | Number of valid completed checks divided by attempted checks, with errors classified                     | Technical reliability for this small pilot only                                     |
| Actionable findings | Accepted findings divided by all reviewed findings, retaining unresolved separately                      | Owner judgment of usefulness; not formal precision without independent ground truth |
| Fix evidence        | A reviewed accepted finding has a recorded change and compatible before/after reports                    | Source fix evidence; task outcome remains unmeasured                                |
| Repeat use          | Owner initiates another check on a later release                                                         | Stronger than automatic runs from an abandoned schedule                             |
| Retention decision  | Owner explicitly keeps, removes, or defers the integration, with reason                                  | Product usefulness signal; not revenue or market adoption                           |

Proposed continuation criterion: at least one useful finding or explicitly valued regression check, acceptable noise for the team, and an owner who elects to keep using it. If no useful finding appears, retain that result and investigate fit; do not manufacture a success story. Report exact counts and small-sample limitations, not projected percentages across the market.

## Data and publication

Use a pilot identifier and approved target identifier. Retain only the bounded evidence needed for comparison; avoid full response bodies, credentials, personal submissions, and query-string secrets. Agree on target approval and report retention before collecting partner data. Use the partner's existing CI artifacts or storage where practical; durable hosted report history is not an available promise.

Pilot records are separate from the frozen, audited-partial, uncalibrated WRI v1 artifact. Never use the 100,000 attempted ranks as an adoption claim or rerun that collection for a partner.

Any public case study needs the application owner's permission and an explicit review of the exact material. Permission to test is not permission to publish a company name, logo, result, or quote.

## Information needed to start

- One technical owner and an approved public page or suitable fixture.
- The two releases or changes to compare, plus a reviewer for findings.
- A place to retain the reports and a decision on retention duration.
- A known request budget and explicit retry behavior.

Runtime evaluation can be a later, separate experiment after a browser adapter and independent postcondition checks exist. Provider documentation showing browser support does not make that integration complete.
