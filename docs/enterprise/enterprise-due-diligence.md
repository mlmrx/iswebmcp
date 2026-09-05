# Enterprise opportunity diligence

Reviewed: September 5, 2026. Status: illustrative, not validated with any named company.

These five case studies are **opportunity scenarios**, not customer stories. They describe a proposed evaluation with a named product team or an owner-approved reference application. They do not say that Cisco, Akamai, Microsoft, Adobe, or Salesforce uses isWebMCP, supports browser WebMCP, has agreed to a pilot, or has produced results with us. No company applications were scanned, no authenticated systems were accessed, and no outreach occurred in this research.

## Method and claim boundaries

We reviewed vendor-authored product and developer documentation, using canonical URLs. Eleven primary references support the five public scenarios. Product facts have explicit source IDs in `lib/enterprise/scenarios.ts`; workflows, staffing, deliverables, and acceptance criteria are our proposals. Numeric pilot scopes and targets are not measured outcomes or ROI forecasts.

Selection emphasizes a specific public web surface, an identifiable engineering owner, a documented release or customization workflow, and a small consented evaluation with an honest no-go option. It is not a ranking of enterprise size or commercial intent. Cisco, Akamai, and Microsoft were requested by the owner. Adobe and Salesforce were selected as additional product-fit candidates, not because we know their procurement appetite.

Current isWebMCP utility is bounded, hosted, unauthenticated public-source collection; Node SDK/CLI and saved source comparison; GitHub CI examples; imported contract review; and remote MCP recipes/comparison. Available recipes cover a search tool and accessible controls. Comparable reports require complete collections, matching final URL, scanner model, and input context. A new staging hostname is not directly comparable to a production hostname. The current toolkit does not ingest Power Pages YAML, Akamai property configuration, AEM author instances, or private Salesforce component source as a URL scan.

We do not yet provide a private scanner, authenticated browser runner, runtime task verification, enterprise SSO/RBAC, durable tenant report history, or an SLA. Running our CLI in a customer's CI does not make URL collection local: scans still call the hosted service. Local saved-report comparison is a separate operation. A proposed pilot must accept the actual hosted data flow or stop; do not suggest temporarily removing security controls.

Browser WebMCP remains experimental, not a W3C Standard. Existing REST APIs, server-side MCP, vendor agent products, and browser WebMCP are distinct. A documented API or customization point is evidence of a possible integration surface, not proof of browser WebMCP compatibility. Source-level changes are not proof of agent task success, accessibility conformance, authorization safety, conversion lift, or cost savings. WRI v1 is not used to select or score these companies.

## Why these five, and where to start

| Target                        | Proposed owner and useful opening                                                                                 | Main unresolved gate                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Adobe / AEM Forms             | Reference-template or developer-experience team; a public synthetic form with an identifiable component owner     | Are meaningful controls in fetched HTML, and does our finding add anything to existing tests?        |
| Microsoft / Power Pages       | Reference-solutions team; post-release evidence on an already-approved public reference site                      | Public-only hosted collection must fit tenant policy; never change visibility for the scanner        |
| Cisco / support discovery     | Digital support team plus API security reviewer; source checks for a public product finder                        | A public discovery workflow must provide value without accessing authenticated Support APIs          |
| Akamai / reference property   | Web-platform or developer-experience team; independent source evidence alongside existing property release checks | Same-URL collection must be representative without bypassing protection or entering Sandbox          |
| Salesforce / Experience Cloud | Component/reference-solutions team; public synthetic CMS discovery and contract review                            | Source coverage and Lightning Web Security compatibility must be established before an adapter pilot |

Our suggested outreach order is Adobe, Microsoft, Cisco, Akamai, then Salesforce. This is a qualitative assessment of the smallest feasible pilot, not a probability-of-sale model. Adobe offers a direct match to the accessible-controls recipe. Microsoft has a documented configuration/CI workflow but a strong visibility gate. Cisco provides a clear boundary between public discovery and protected APIs. Akamai has a release workflow, but our source findings must be additive to its existing tests. Salesforce has component extension points, but its security and rendering model make a ready-made integration claim inappropriate.

The enterprise names identify target teams, not a right to test every customer application on their platforms. If a platform customer or implementation agency owns the actual test site, that owner must consent independently. We should ask for one safe reference workflow rather than for tenant credentials or broad portfolio access.

## Alternatives screened

- **ServiceNow:** its official [Customer and Consumer Service Portals documentation](https://www.servicenow.com/docs/r/customer-service-management/customer-self-service-and-omnichannel-engagement/configure-csm-service-portals.html) describes self-service search and assistance. The [portal usage guide](https://www.servicenow.com/docs/r/customer-service-management/use-the-customer-portal.html) distinguishes logged-in experiences. This is a plausible later target, but meaningful case/status workflows would test capabilities we do not currently provide. A public knowledge-only pilot could be reconsidered if an owner supplies a suitable surface; this is not a blanket claim that all ServiceNow pages require authentication.
- **SAP:** [Build Work Zone security](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/security?locale=en-) documents identity configuration, while [About External Users](https://help.sap.com/docs/build-work-zone-advanced-edition/sap-build-work-zone-advanced-edition/about-external-users) describes identity setup for external users. Authenticated workspace evaluation is a poor first fit for our public-source service. SAP public commerce or documentation would be a different scope requiring its own diligence; no general exclusion is implied.

These alternatives were screened for near-term product fit only. No buying signals, budgets, relationships, active projects, or willingness to partner were verified.

## Source register and dates

All links below were accessed September 5, 2026. The source model deliberately leaves `publishedAt` null where first publication was not verified. A displayed last-update date is recorded below as an update, not silently relabeled as publication. Relative ages and search-engine crawl dates are not publication evidence.

| Source                                                                                                                                                                                  | Visible dating evidence                         | Supports                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Cisco Product Information](https://developer.cisco.com/docs/support-apis/product-information/)                                                                                         | No exact publication/update date verified       | REST/JSON product lookups and product-support URL fields                                         |
| [Cisco Support API Authentication](https://developer.cisco.com/docs/support-apis/authentication/)                                                                                       | No exact publication/update date verified       | Application credentials and bearer-token boundary                                                |
| [Akamai Property Manager CLI](https://akamai.github.io/cli-property-manager/)                                                                                                           | No exact publication/update date verified       | Property workflow and staging/production promotion; not a claim about the latest package version |
| [Akamai Sandbox](https://techdocs.akamai.com/sandbox/docs/introduction-sandbox)                                                                                                         | Relative update age only; exact date unverified | Isolated configuration-test environment                                                          |
| [Microsoft Power Pages CLI](https://learn.microsoft.com/en-us/power-pages/configure/power-platform-cli)                                                                                 | Last updated July 11, 2025                      | Configuration source control and CI/CD; installed-version details require pilot confirmation     |
| [Microsoft site visibility](https://learn.microsoft.com/en-us/power-pages/security/site-visibility)                                                                                     | Last updated March 17, 2026                     | Private default, developer-environment restriction, non-production governance                    |
| [Adobe EDS Forms](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/build-forms/overview)                                               | Last updated June 5, 2026                       | Form authoring choices and web-language customization                                            |
| [Adobe external repositories](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/managing-code/external-repositories) | Last updated June 17, 2026                      | Repository events and Cloud Manager integration surfaces                                         |
| [Salesforce Experience Cloud components](https://developer.salesforce.com/docs/platform/lwc/guide/use-experience-cloud-overview.html)                                                   | No exact publication/update date verified       | Custom component extension point                                                                 |
| [Salesforce CMS content](https://developer.salesforce.com/docs/platform/cms/guide/cms-dev-display-cms-content-in-sites.html)                                                            | No exact publication/update date verified       | CMS-backed Experience Builder surfaces                                                           |
| [Salesforce Lightning Web Security](https://developer.salesforce.com/docs/platform/lightning-components-security/guide/lws-lms-ec.html)                                                 | No exact publication/update date verified       | LWR component security boundary                                                                  |

The ServiceNow alternative references display March 12, 2026 updates. Exact dates were not verified for the SAP references. Documentation currency is not deployment testing: package versions, licensed capabilities, selected tenant controls, and actual source coverage remain unknown until an authorized pilot.

## Qualification before a pilot

1. Confirm who owns the reference page, application changes, and release pipeline. Obtain a named reviewer and written scope for a small set of URLs; do not infer authorization from a public URL.
2. Confirm that content, paths, query parameters, and submitted reports are acceptable for our hosted service. Reject credentials, sensitive records, production form submissions, and any request to bypass restrictions.
3. Establish source coverage on the approved surface. If the useful interface needs client execution, report the limitation and stop rather than selling a synthetic readiness score.
4. Agree on identical-URL baseline conditions, complete collection handling, artifact retention, and a manual disposition for each prioritized finding. Incomplete or incompatible evidence does not earn a pass.
5. Define a small reversible reference-template fix. Never manufacture a defect on a production site; seeded checks belong only in an owner-approved synthetic reference application.
6. Measure setup effort, completed collection count, reviewer effort, useful findings, and reuse on a second release. Track false positives and redundancy with existing tools, not only positive anecdotes.
7. Decide whether to proceed, narrow scope, or stop. Private execution and runtime proof are separate future work, not hidden prerequisites billed as existing features.

The next independent work we can do is prepare reference fixtures and a bounded evaluation protocol. Claims of customer outcomes, named-company recommendations, logos, quotes, and measured savings must wait for actual evidence and permission.
