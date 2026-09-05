# Partner due diligence and unsent pilot proposals

Reviewed: September 5, 2026. Status for every company: **prospect—not contacted**.

This is a researched, constrained shortlist, not five customer case studies, an objective global top five, or an announcement of partnerships. GoDaddy, Lovable, and Cloudflare were included at the owner's request. Vercel and Browserbase were selected from six additional candidates to cover release-workflow distribution and the missing runtime-evidence layer. No company application was scanned; no account was accessed, application filed, or message sent. The companion website records live in `lib/enterprise/partners.ts`; this memo is preparation for owner-reviewed outreach, not a public endorsement page.

## What we can honestly offer

Today: bounded public, unauthenticated HTML inspection; Node SDK/CLI; a GitHub Actions adapter; local saved-JSON comparison; supplied-contract lint; and a remote MCP server with implementation recipes and source comparisons. Recipe code is a starting point that developers review and integrate. Neither a recipe nor a successful source comparison proves runtime task completion.

The CLI's scan request goes to the hosted scanner. A local CLI does not make the collection private or bring the user's browser cookies. The local comparator requires the same final URL, model, input fingerprint, and complete compatible reports. Commit-specific preview URLs cannot be renamed in the JSON to manufacture compatibility. Internal pages, authenticated journeys, client-only content absent from returned HTML, broad scheduled monitoring, automatic changes, SSO/RBAC, an enterprise SLA, and durable hosted report history are not current offerings.

Our first ask should be for one technical owner and one narrowly scoped, consented workflow—not a logo, an enterprise purchase, or access to a company's user base. Potential reach is not adoption evidence. The frozen WRI v1 dataset is not a market-adoption measure and plays no role in prospect scoring.

## Selection method

Each dimension is an editorial inference scored 0, 1, or 2: **0** means no useful fit evidenced for the proposed work; **1** means conditional or dependent on substantial work; **2** means a strong documented surface or a directly usable existing workflow. These are prioritization judgments, not measurements of company quality, commercial intent, or approval likelihood.

- **Current utility:** can our present product help this workflow without pretending a missing feature exists?
- **Integration path:** is a relevant technical surface and a public engagement route documented?
- **Reusable distribution:** could one integration or repeatable recipe help multiple consenting teams?
- **Pilot tractability:** can a bounded first test run without broad access, product migration, or a large new service?
- **Runtime potential:** does the relationship help independently evaluate a real task later?

Totals use equal weights. Ties favor current utility, then reusable distribution, then company name. A change in objective should change the shortlist: for an exclusively near-term publishing workflow, Webflow is a stronger alternate than a future Browserbase adapter; for production journey monitoring, Checkly warrants another review.

| Selected prospect | Current utility | Integration path | Reusable distribution | Pilot tractability | Runtime potential | Total / 10 | Main reason                                                                  |
| ----------------- | --------------: | ---------------: | --------------------: | -----------------: | ----------------: | ---------: | ---------------------------------------------------------------------------- |
| Vercel            |               2 |                2 |                     2 |                  2 |                 1 |          9 | Existing release/CI workflow before Marketplace work                         |
| Cloudflare        |               1 |                2 |                     2 |                  1 |                 2 |          8 | Remote MCP plus an explicitly experimental WebMCP browser lab                |
| Lovable           |               1 |                2 |                     2 |                  1 |                 1 |          7 | Builder-chat guidance and reviewed code changes; HTML visibility gate        |
| Browserbase       |               1 |                2 |                     1 |                  1 |                 2 |          7 | Future independent browser-evidence adapter, not ready-made coverage         |
| GoDaddy           |               1 |                1 |                     2 |                  1 |                 0 |          5 | Requested agency-channel hypothesis with limited direct integration evidence |

GoDaddy's inclusion is deliberate, not proof it outranks all alternatives. Do not turn these scores into a landing-page claim that these companies are our customers, endorse isWebMCP, or have committed to integrating it.

## Full additional-candidate screen

All six candidates below were screened against primary documentation. The three owner-requested companies above are additional to this screen.

| Candidate       | Primary evidence                                                                                                                                                                                                                                                                                                                           | Decision and product-specific diligence                                                                                                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**      | [Integration surfaces](https://vercel.com/docs/integrations), [review checklist](https://vercel.com/docs/integrations/create-integration/approval-checklist), [generated URLs](https://vercel.com/docs/deployments/generated-urls), [Deployment Protection](https://vercel.com/docs/deployment-protection)                                 | Selected. The existing CI adapter gives us a near-term delivery mechanism. Compare a stable, already-public target across releases, not two protected commit previews. Native Marketplace resource lifecycle, authentication, tenant isolation, and support remain to build.                                                                                                 |
| **Webflow**     | [App registration](https://developers.webflow.com/apps/data/docs/register-an-app), [Marketplace submission](https://developers.webflow.com/apps/docs/marketplace/submitting-your-app), [partnership form](https://webflow.com/apps/partner)                                                                                                | Strong next distribution prospect. Designer/Marketplace surfaces provide a credible path, but an app needs to be built and reviewed, and external installation is not generally available by default. Defer to keep the first five complementary; revisit if agencies or designers return after their first source check.                                                    |
| **Shopify**     | [App extensions](https://shopify.dev/docs/apps/build/app-extensions), [theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)                                                                                                                                                                        | Strong vertical potential, but theme compatibility and merchant approval matter. Theme app extensions can package merchant-enabled changes; they do not validate checkout behavior. Defer until one read-only storefront task and a safe theme-specific recipe are independently validated. No cart, order, payment, or customer-data access in an initial pilot.            |
| **Checkly**     | [Monitoring-as-code workflow](https://www.checklyhq.com/why-monitoring-as-code/), [monitoring guides](https://www.checklyhq.com/docs/guides/overview/), [browser-check API](https://www.checklyhq.com/docs/api-reference/checks/create-a-browser-check/)                                                                                   | Strong runtime-monitoring alternate. It already brings Playwright and operational monitoring into CI, so duplicating its monitor is a weak pitch. Our differentiator would need to be versioned source/contract evidence and an independent task assertion. Defer until that evidence adapter exists; reconsider before building recurring runtime monitoring ourselves.     |
| **Browserbase** | [Browser sessions](https://docs.browserbase.com/platform/browser/getting-started/using-browser-session), [session replay](https://docs.browserbase.com/platform/browser/observability/session-replay), [integration guidance](https://docs.browserbase.com/integrations/get-started), [public intake](https://www.browserbase.com/partner) | Selected for a research/integration design pilot. Browser sessions and replay are a potential substrate for an evidence adapter without claiming we already run one. It is below Vercel and Cloudflare on the current shortlist and below Lovable on the distribution tie-break. Documentation of automation or remote MCP does not establish native browser WebMCP support. |
| **Trigger.dev** | [Playwright build extension](https://trigger.dev/docs/config/extensions/playwright), [Puppeteer examples and usage boundaries](https://trigger.dev/docs/guides/examples/puppeteer), [introduction and contact routes](https://trigger.dev/docs/introduction)                                                                               | Useful later orchestration layer. Current GitHub Actions already covers a bounded release check; a second scheduler does not resolve missing task verification. Revisit for durable runtime jobs after the executor, cancellation, authorization, and evidence contracts exist. Do not interpret browser examples as permission to scrape third-party sites.                 |

## 1. Vercel: a release evidence pilot

**Value hypothesis.** A developer should be able to review a concrete source finding, commit a supported fix, and attach a comparable artifact to the next release. This tests repeat usefulness rather than a one-time scan count. Vercel documents testing integrations and a formal review path, but a native commercial integration would involve more lifecycle and support work than our existing CLI. [Integration overview](https://vercel.com/docs/integrations), [approval checklist](https://vercel.com/docs/integrations/create-integration/approval-checklist).

Start with a public fixture or a consenting team's public page on a stable URL. Wait for a release to be ready, save the source summary as a CI artifact, and rerun only after a developer-approved change. Vercel's unique deployment URL model and protection controls mean a generic “compare this preview against production” pitch is currently wrong for our exact-target comparator. Do not use bypass tokens or weaken project protection. [Generated URLs](https://vercel.com/docs/deployments/generated-urls), [Deployment Protection](https://vercel.com/docs/deployment-protection).

**Pilot ask.** One technical reviewer, one public target, two releases. Deliver a reusable CI example and a short finding-to-fix note. Measure setup effort, complete collection rate, valid comparisons, accepted findings, and voluntary repeat use. The pilot passes only if a developer can use the evidence in a real review; a rising heuristic score is not the goal. Begin advisory-only. Native Marketplace submission follows a successful pilot, not the reverse.

**Public route:** the [official approval checklist](https://vercel.com/docs/integrations/create-integration/approval-checklist) publishes `integrations@vercel.com` for integration review. This is a verified public team address, not a guessed individual's email. It is not a guarantee of early-stage partnership support.

**Unsent draft:**

> We are building isWebMCP, a developer utility for public-page source findings, supported implementation recipes, and strict before/after evidence. Our existing GitHub Actions workflow could complement Vercel release reviews. Could the integrations team help us validate a one-project, two-release advisory pilot before we invest in native Marketplace onboarding? We would provide the runnable example and collect setup friction and accepted findings. Protected previews, runtime task verification, and automatic fixes are explicitly out of scope. This is a design-pilot inquiry, not a claim that we meet Marketplace requirements yet.

## 2. Cloudflare: a lab-only browser evidence design

**Value hypothesis.** Cloudflare provides two distinct opportunities: Agents can consume our ordinary remote MCP tools, while Browser Run's experimental WebMCP lab could help design a future runtime evaluation. Its documentation explicitly identifies the Chrome-beta lab pool and warns against production workloads. Keep that qualification visible in any proposal. [Agents MCP](https://developers.cloudflare.com/agents/tools/mcp/), [WebMCP Beta](https://developers.cloudflare.com/browser-run/features/webmcp/).

The first test can be a remote-MCP connection to our current public utility. The later browser experiment needs an owned search fixture, a version-pinned browser and adapter, and an independent assertion of the visible result. The lab documentation contains a testing API example; it must not be assumed identical to every later draft API. Unsupported combinations are a result worth recording. Neither tool discovery nor a JSON response proves a task completed correctly.

**Pilot ask.** One engineering reviewer to examine an evidence format and one low-risk fixture. We supply the source artifact, current recipe, explicit stop conditions, and proposed outcome assertion. Any browser account, spending cap, data retention, and experimental execution need separate agreement. No migration of isWebMCP hosting is proposed; the site stays on Next.js and Vercel. Cloudflare is an optional integration surface, not a deployment adapter to restore.

**Public route:** [Technology Partner Program](https://www.cloudflare.com/partners/technology-partners/), which includes developer services and an Apply route. Technical fit does not imply acceptance, available engineering support, or joint marketing rights.

**Unsent draft:**

> Could we discuss a small developer-services design pilot? isWebMCP already offers source audits and implementation recipes over remote MCP. We would like to validate a Cloudflare Agents connection, then separately review a lab-only WebMCP evidence protocol for one owned search fixture. We saw Browser Run's explicit experimental/no-production boundary and would preserve it. Our contribution is source-to-task evidence separation and independent outcome assertions, not another browser host. We would agree budget, browser compatibility, and recording policy before any execution.

## 3. Lovable: a finding-to-fix builder loop

**Value hypothesis.** The useful entry point is builder context, not a widget installed into every generated app. Lovable distinguishes MCP chat connectors from app capabilities, offers custom MCP connections, and documents GitHub synchronization. This makes a scoped “check, propose, review, republish, compare” workflow plausible. It is not evidence that our endpoint has been tested in Lovable or that a published app gains native WebMCP automatically. [Connector types](https://docs.lovable.dev/integrations/introduction), [custom MCP](https://docs.lovable.dev/integrations/custom-mcp), [GitHub synchronization](https://docs.lovable.dev/integrations/github).

The main diligence gate is visibility. If the useful UI appears only after JavaScript runs or after login, the current scanner cannot inspect that UI. A complete response from an HTML shell is still insufficient task evidence. Start with a builder-owned public example that has relevant returned form markup; collect an unsupported result honestly when it does not. Keep publish URL and redirect changes explicit, and establish a new baseline when target identity changes. [Publishing controls](https://docs.lovable.dev/features/publish).

**Pilot ask.** One builder, one supported change, one repeat check. We provide a connector test checklist, a recipe prompt, and a plain-language report explanation. The owner reviews any code and republishes it. Count understood findings, reviewed changes, and repeat use—not generated tokens, broad app counts, or invented business gains. A future rendered/private executor is a separate engineering commitment.

**Public route:** [Lovable partnerships](https://lovable.dev/partners), specifically a qualified solution-partner inquiry or request for routing to integrations. The page is not proof of an unrestricted technology connector Marketplace.

**Unsent draft:**

> We would like to test a narrow builder workflow: request an isWebMCP public-source check, review a supported recipe, and compare the same published URL after an owner-approved change. Could you route us to a solution or integration reviewer for one consenting example project? We already expose remote MCP tools, but have not validated a Lovable connection. We would explicitly flag client-only or authenticated content as outside the current scanner, and would not automatically edit or publish the project. We can supply a small onboarding guide and document where the workflow fails.

## 4. Browserbase: a runtime-evidence adapter, not another monitor

**Value hypothesis.** Our current platform cannot establish whether an agent actually achieved the intended result. Browserbase documents remotely controlled browser sessions and replay, making it a plausible provider-neutral execution substrate for a new adapter. Its separately documented MCP server concerns browser control; the reviewed material does not establish native browser WebMCP availability. [Using sessions](https://docs.browserbase.com/platform/browser/getting-started/using-browser-session), [replay](https://docs.browserbase.com/platform/browser/observability/session-replay), [MCP server](https://docs.browserbase.com/integrations/mcp/introduction).

A recording is supporting evidence, not the correctness oracle. Start with an owned search fixture where we can deliberately produce a wrong result and prove that an independent assertion catches it. Keep source report, tool registration, tool invocation, and task outcome as separate records. Bound origins, time, and actions; test cancellation and an unsupported native API. No production identity, shopping action, or anti-bot evasion belongs in this experiment.

**Pilot ask.** Review an adapter contract and a small fixture harness. Account usage and execution costs must be agreed before running sessions. Browserbase documents default session recording and a way to disable it, so recording consent and retention are a first-class design choice, not something to discover after testing. Access to replay must not expose API credentials or sensitive contents. We need to build this adapter before offering ongoing runtime monitoring to enterprise customers.

**Public route:** [Browserbase integration intake](https://www.browserbase.com/partner), linked from [official integration guidance](https://docs.browserbase.com/integrations/get-started). It asks for an introduction draft, quickstart draft, and code link; those are prerequisites for a mature submission, not artifacts we should pretend already exist.

**Unsent draft:**

> We are designing an isWebMCP adapter that keeps public-source findings separate from independently asserted browser task outcomes. Could your integration team review a minimal one-fixture proposal? We would contribute a runnable search test with deliberate failure cases, an evidence schema, and integration documentation. We are not asking to automate third-party sites or use production credentials. Before sessions run, we would agree browser compatibility, recording policy, and a spending cap. Our existing product is source-only; the proposed runtime adapter is work to build, not a shipped capability.

## 5. GoDaddy: an agency-delivered service hypothesis

**Value hypothesis.** Agencies can translate a technical finding into a supported client change and a clear handoff. GoDaddy's Agency Partner Program and Hub offer a potential channel, but the program has stated customer/agency eligibility requirements and is not a verified technology-plugin Marketplace. The right first collaborator might be an existing agency, not a corporate integration team. [Agency program](https://www.godaddy.com/pro/agency-partners).

Websites + Marketing permits custom-code sections and warns that embedded code can affect the site. That does not establish permission to modify built-in controls or a guarantee that a browser tool registered inside a section controls the main document. Check each product and frame boundary before promising a compatible recipe. The developer platform's domain and commerce APIs likewise do not imply a website-builder rewrite API. [Custom-code documentation](https://www.godaddy.com/en-ca/help/add-html-or-custom-code-to-my-site-27252), [developer platform](https://developer.godaddy.com/en).

**Pilot ask.** One consenting agency, one client-owned public lead page, and a supported change approved by that client. We provide a report explanation, applicability checklist, and saved source comparisons. The agency supplies the product expertise and normal change process. Measure time to a useful finding, unsupported recommendations, accepted changes, and a voluntary maintenance rerun. Do not make claims about leads, bookings, conversion, or revenue without an appropriate measured study.

This is the least certain direct-integration fit of the selected five. It remains useful as an agency-distribution hypothesis because the owner explicitly asked us to explore it. If direct developer integration is the only goal, move Webflow or Checkly ahead rather than inflating GoDaddy's score to satisfy a “top five” headline.

**Public route:** [Agency Partner Program](https://www.godaddy.com/pro/agency-partners). Confirm agency eligibility first or seek an existing program member; no application has been submitted.

**Unsent draft:**

> We are exploring an agency-led pilot for isWebMCP: one client-approved public-page check, a supported remediation, and a clear before/after source-evidence handoff. Is this appropriate for an existing GoDaddy agency collaborator, and if so could you advise the right route? We would not access client accounts, alter DNS, or assume your site builder permits every code recipe. We can provide the review checklist and report explanation; the agency and client retain approval over changes. We are seeking a small design pilot, not claiming a GoDaddy integration or partner status.

## Before any outreach or pilot

1. Recheck the linked public route, product documentation, and company-specific claims on the day of contact.
2. Decide the exact sender identity and public contact details. The drafts above are unsent; do not invent individual emails or imply a prior conversation.
3. Send the narrowest relevant artifact, labeled illustrative/proposed. Do not present a hypothetical case as a customer result, use company logos as endorsements, or publish private correspondence.
4. Agree ownership, public target eligibility, data sharing, quotas, and retention. Inspect the current isWebMCP privacy/storage behavior rather than promising zero retention or enterprise isolation.
5. Start with supported source evidence. Any browser session, credentials, recurring job, paid resource, or consequential action requires separately specified authorization and implementation.
6. Record outcomes with denominators: contacted, responded, agreed to pilot, completed first useful check, integrated a reviewed fix, repeated voluntarily. None of these counts exist yet for this shortlist.

### Source dates and evidence boundaries

All links in this memo were accessed September 5, 2026. The structured source records intentionally use `publishedAt: null`: documentation “last updated” labels are not publication dates. For example, Cloudflare's WebMCP lab page displayed April 23, 2026 as its update date, and Vercel's approval checklist displayed August 11, 2026. These dates do not imply isWebMCP compatibility was tested at that time. No runtime integration validation, customer interview, commercial intent, adoption estimate, or partnership confirmation was obtained through this documentation review.
