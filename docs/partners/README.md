# Design-partner pipeline

Reviewed September 5, 2026. These are researched prospects, not existing partners, endorsements, or confirmed users. No outreach has been sent. Technical fit below is an inference from official documentation; an integration is not validated until it runs in that provider's environment.

The immediate offer is a small source-evidence pilot: inspect an owner-approved public URL, preserve the bounded findings, review one proposed fix, and compare a later release. The current Node SDK, CLI, and local GitHub Actions adapter are available through the [developer quickstart](https://iswebmcp.com/developers). The GitHub repository is private, as recorded in [content operations](../content-operations.md); the pilot must not depend on anonymous repository access or an assumed npm release.

## Outreach order

| Order | Prospect                | Concrete proposed utility                                                                                 | Verified capability and route                                                                                                                                                                                                                                                                                  | Feasibility and unanswered question                                                                                                                                                                                                                  |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Checkly                 | Run a source-evidence check beside an existing release check; retain both outputs independently.          | [CLI documentation](https://www.checklyhq.com/docs/cli/overview/) documents JavaScript/TypeScript and GitHub Actions workflows. The [company contact page](https://www.checklyhq.com/about/) publishes `info@checklyhq.com`.                                                                                   | Good fit for a separate CI job. Hosted Checkly runtime compatibility has not been tested. Will one team find additional, actionable information in the source report?                                                                                |
| 2     | Trigger.dev             | A deployment-triggered task that requests an audit and returns structured evidence for the release owner. | [Task documentation](https://trigger.dev/docs/tasks/overview) documents TypeScript tasks and JSON-serializable outputs. The [contact form](https://trigger.dev/contact) accepts a project message.                                                                                                             | Good fit for a small task example. Validate retry behavior against audit API limits before any repeated operation. No customer demand has been established.                                                                                          |
| 3     | Pipedream               | An API action that accepts a public URL and returns findings to the next workflow step.                   | [Node.js steps](https://pipedream.com/docs/workflows/building-workflows/code/nodejs) support HTTP requests and JSON outputs. The [App Partners page](https://pipedream.com/docs/apps/app-partners) offers an integration process and links to [support](https://pipedream.com/support).                        | API-first pilot avoids an assumed package registry release. The linked support destination returned no readable form in this research session; routing to the integrations team still needs owner/browser access.                                    |
| 4     | Inngest                 | An event-triggered audit with results saved by the adopting application's existing backend.               | [Functions documentation](https://www.inngest.com/docs/learn/inngest-functions) describes TypeScript functions, events, and retries. The [contact form](https://www.inngest.com/contact) is explicitly a sales route; the page also links to [community access](https://www.inngest.com/discord).              | Technically plausible, untested. Ask for the appropriate integrations contact without posing as a buyer. Do not promise hosted history through isWebMCP.                                                                                             |
| 5     | Refine                  | Co-design an example showing what source inspection can and cannot observe in a business-app template.    | [Refine documentation](https://refine.dev/core/docs/) documents forms, authentication, and framework integrations. The [Core page](https://refine.dev/core) publishes `info@refine.dev` and a contact form.                                                                                                    | Conditional fit: client-rendered and authenticated screens may be invisible to a public source scan. First qualify a suitable public/server-rendered fixture or a supplied contract. Do not market the current scanner as a React runtime inspector. |
| 6     | Browserbase / Stagehand | Later, pair source findings with browser execution evidence and independent task postconditions.          | [Browser session documentation](https://docs.browserbase.com/platform/browser/getting-started/using-browser-session) documents automation connections. [Integration documentation](https://docs.browserbase.com/integrations/get-started) links to the [partner request](https://www.browserbase.com/partner). | Future runtime collaboration. Requires a browser adapter, versioned fixtures, credentials, and budget. The partner link is verified in official docs; the form itself could not be inspected successfully.                                           |

Six qualified prospects are more useful than a large list of logos. Checkly, Trigger.dev, Pipedream, and Inngest are potential distribution/integration partners; their users would still need to opt into an actual design pilot. Refine is a potential template partner. Browserbase is a future runtime partner. None is currently a recruited design partner.

## What we can finish ourselves

- Ship a reproducible, downloadable source-check example with explicit installation and API compatibility requirements.
- Supply sample evidence, a before/after comparison, known limits, and the [pilot brief](pilot-brief.md).
- Test the sample in our environment, record failures, and document installation time without treating our own run as partner adoption.
- Prepare tailored messages and maintain a contact/event record in [pipeline.json](pipeline.json).

What needs another party: an authorized outbound account or owner submission, a response from the prospect, a willing application owner, an approved test URL, and agreement on any shared data or publication. These are explicit dependencies, not completed milestones.

## First messages

Drafts are ready for owner review and routing. Do not add an unverified customer count, performance gain, marketplace approval, npm install command, or public GitHub claim. The name below is the proposed sender; the actual sending account must belong to the owner.

### Checkly

**Recipient:** public company contact, `info@checklyhq.com`

**Subject:** Small source-evidence pilot beside Checkly release checks

Hi Checkly team,

I'm Mahesh, building isWebMCP, a developer utility for inspecting agent-facing page source and comparing findings after changes. Your monitoring-as-code workflow looks like a useful place to test a complementary source check.

Would someone on your developer-relations or integrations team review a two-week pilot with one willing application team? We would provide the CLI/CI example, help review findings on one approved public page, and compare two releases. We would measure actionable findings, false alarms, setup effort, and whether the team keeps the check. This does not claim to verify browser task completion.

The toolkit is available at [iswebmcp.com/developers](https://iswebmcp.com/developers). Could you point me to the right person to assess the pilot?

Mahesh

### Trigger.dev

**Recipient:** [official contact form](https://trigger.dev/contact)

**Subject:** A deployment-triggered source-audit example for Trigger.dev

Hi Trigger.dev team,

I'm Mahesh, building isWebMCP. We expose structured source-audit findings for public web pages through an API and Node toolkit. Your task model looks suitable for a small example: a release event requests an audit and returns findings for the application owner to review.

Would you be open to reviewing that example with one developer already using Trigger.dev? We would build the task, check retries and error handling against our API limits, and help compare an approved page across two releases. The useful test is whether it exposes a real fix and earns repeat use, rather than just running successfully.

Our current toolkit is at [iswebmcp.com/developers](https://iswebmcp.com/developers). Is there an integrations or developer-experience contact who could assess this scope?

Mahesh

### Pipedream

**Recipient:** integrations team through the route linked on the [App Partners page](https://pipedream.com/docs/apps/app-partners); routing is not yet resolved

**Subject:** Proposed isWebMCP action: inspect a public URL and return findings

Hi Pipedream integrations team,

I'm Mahesh, building isWebMCP. Your App Partners program looks relevant to a focused action: accept an owner-approved public URL, call our source-audit API, and return structured findings for the next workflow step.

We can provide API documentation, sample responses, failure cases, and a small test fixture. Could your team review whether this fits the integration program and identify the requirements we should satisfy first? We would start with one action and measure successful first use, actionable findings, and repeat use with a willing pilot user.

The developer toolkit is at [iswebmcp.com/developers](https://iswebmcp.com/developers). Our current evidence describes page source; it does not certify that an agent can complete a task.

Mahesh

## Pipeline discipline

Record a message as sent only after the sending tool confirms it, preserving the actual channel and time. A reply is a response signal; an agreed pilot is an intent signal; a retained integration with a reviewed useful finding is a usage signal. A platform listing or introduction alone is not adoption.

A first wave contains at most the three drafted messages, personalized and sent once through the appropriate route. Follow-ups require an actual sent record and a relevant reason; do not post promotional GitHub issues or community messages as a substitute for a contact channel. No automated outreach or follow-up schedule is configured here.
