import type { PartnerProspect, ResearchSource } from './types';

const reviewedAt = '2026-09-05';
const source = (id: string, title: string, url: string): ResearchSource => ({
  id,
  title,
  url,
  publishedAt: null,
  accessedAt: reviewedAt,
});

// A constrained, editorial shortlist, not a global ranking or adoption measurement.
// Equal-weight rubric: 0 = no evidenced fit; 1 = conditional; 2 = strong fit.
// Ties favor current utility, then reusable distribution, then company name.
export const partnerProspects: PartnerProspect[] = [
  {
    slug: 'vercel',
    company: 'Vercel',
    product: 'Deployment workflows and integrations',
    title: 'Make source evidence part of a release',
    summary:
      'Proposed design partnership: help one team keep a public-page baseline with each release. Start with our existing CI workflow, not a claim of a native Marketplace integration.',
    reviewedAt,
    status: 'prospect-not-contacted',
    context: [
      {
        claim:
          'Vercel documents third-party integrations, including testing tools, and distinguishes native Marketplace integrations from connectable accounts.',
        sourceIds: ['vercel-integrations'],
      },
      {
        claim:
          'Deployments can have commit-specific and stable branch URLs. Deployment Protection can require authentication, which our hosted scanner does not carry.',
        sourceIds: ['vercel-urls', 'vercel-protection'],
      },
      {
        claim:
          'Marketplace review has explicit installation, security, documentation, and support requirements; an existing command-line check does not meet them automatically.',
        sourceIds: ['vercel-review'],
      },
    ],
    integration: [
      'An owner chooses one already-public, stable URL with useful server-returned HTML. Run the isWebMCP CLI after the deployment becomes ready, then retain the summary JSON as their CI artifact.',
      'After a reviewed fix reaches that same URL, compare complete reports with the same scanner model and input fingerprint. Treat commit-specific preview URLs as separate targets; never rewrite their identity to force a comparison.',
      'Start in advisory mode. A later project-scoped integration could attach findings to deployment checks only after installation, deletion, authentication, and failure-handling flows are implemented and tested.',
    ],
    availableNow: [
      'Public HTML scans, supported starter recipes, and developer-controlled GitHub Actions jobs.',
      'Local comparison of compatible saved JSON reports; no Vercel account credential is required for a public-page pilot.',
    ],
    requiresWork: [
      'Native project selection, signed webhook handling, durable tenant-scoped evidence, and a Marketplace review package.',
      'An authorized private runner before protected previews are eligible; never disable protection to make an audit work.',
    ],
    pilot: {
      scope:
        'Proposed scope, not a commitment: one consenting application team, one stable public search or form page, and two successive releases.',
      deliverables: [
        'A reproducible CI example, baseline/current artifacts, and a finding-to-fix review note.',
        'A small integration specification describing advisory failures, retries, and target identity.',
      ],
      successSignals: [
        'Record setup time, complete-run count, and valid-comparison count with denominators.',
        'Ask whether the owner used a finding in a reviewed change and voluntarily reran the check on the next release.',
      ],
      stopConditions: [
        'Stop if the only meaningful target is protected or client-rendered content absent from returned HTML.',
        'Do not block a release on an uncalibrated score or equate fewer source findings with task success.',
      ],
    },
    risks: [
      'Changing preview URLs, caching, redirects, or analysis inputs can invalidate comparisons.',
      'Current service limits and lack of an SLA make broad release-blocking promises premature.',
    ],
    fit: {
      currentUtility: 2,
      integrationPath: 2,
      reusableDistribution: 2,
      pilotTractability: 2,
      runtimePotential: 1,
      rationale:
        'Editorial inference, 9/10: the existing CLI/CI path can support a narrow public deployment pilot now. A documented integration channel is reusable, but native onboarding and runtime evidence are additional work, not present capabilities.',
    },
    contact: {
      label: 'Official integration review route',
      url: 'https://vercel.com/docs/integrations/create-integration/approval-checklist',
      qualification:
        'The official checklist publishes integrations@vercel.com for review requests. Use it only for a qualified integration inquiry; no application or email has been sent.',
    },
    sources: [
      source(
        'vercel-integrations',
        'Vercel integrations',
        'https://vercel.com/docs/integrations',
      ),
      source(
        'vercel-urls',
        'Accessing deployments through generated URLs',
        'https://vercel.com/docs/deployments/generated-urls',
      ),
      source(
        'vercel-protection',
        'Deployment Protection',
        'https://vercel.com/docs/deployment-protection',
      ),
      source(
        'vercel-review',
        'Integration approval checklist',
        'https://vercel.com/docs/integrations/create-integration/approval-checklist',
      ),
    ],
  },
  {
    slug: 'cloudflare',
    company: 'Cloudflare',
    product: 'Agents SDK and experimental Browser Run',
    title: 'Keep source checks and experimental browser evidence distinct',
    summary:
      'Proposed design partnership: a remote-MCP workflow today, plus an explicitly experimental browser-verification protocol later. Cloudflare infrastructure would be optional; isWebMCP remains on native Next.js and Vercel.',
    reviewedAt,
    status: 'prospect-not-contacted',
    context: [
      {
        claim:
          'Cloudflare Agents can connect to external MCP servers and discover their tools. This is ordinary remote MCP, not proof of browser WebMCP support.',
        sourceIds: ['cloudflare-mcp'],
      },
      {
        claim:
          'Separately, Browser Run documents WebMCP Beta in an experimental Chrome-beta lab pool and explicitly says lab sessions should not serve production workloads.',
        sourceIds: ['cloudflare-webmcp'],
      },
      {
        claim:
          'Cloudflare has a Technology Partner Program covering developer services as well as other product areas.',
        sourceIds: ['cloudflare-partners'],
      },
    ],
    integration: [
      'Begin with a partner-controlled Agent calling our existing remote MCP server for a chosen public URL, implementation recipe, or compatible report comparison. Confirm transport compatibility in a sandbox before describing an integration as working.',
      'For a later lab study, use an owned test application with one low-risk search task and independent result assertions. Record the browser build, API surface, inputs, cancellations, and failures instead of treating tool discovery as completion.',
      'Keep source observations, browser observations, and task outcomes as different evidence records. Do not pass experimental browser results into the source-only comparator or change the hosting of isWebMCP.',
    ],
    availableNow: [
      'A hosted remote MCP endpoint with source audit, supplied-contract review, recipes, and strict source comparisons.',
      'A testable starter search adapter whose integration and native-browser compatibility still require developer review.',
    ],
    requiresWork: [
      'A browser adapter, explicit execution authorization, independent task oracle, and versioned runtime-evidence schema.',
      'A budget, session-retention policy, compatibility check, and release policy for any experimental browser pilot.',
    ],
    pilot: {
      scope:
        'Proposed scope: one engineering reviewer and one owned, non-sensitive search fixture. Treat the browser portion as research, not an enterprise production service.',
      deliverables: [
        'A reviewed remote-MCP connection example and a lab-only protocol for the same visible search task.',
        'An explicit source-versus-runtime evidence map and a list of unsupported API or browser combinations.',
      ],
      successSignals: [
        'Measure reproducible connections, schema-valid outputs, and independently asserted task outcomes separately.',
        'Report unsupported, failed, and cancelled runs in the denominator; publish no speed or ROI claim without controlled measurements.',
      ],
      stopConditions: [
        'Stop if the browser API differs from the adapter contract or the task needs production credentials.',
        'No lab-to-production promotion, site-wide automation, security bypass, or consequential action.',
      ],
    },
    risks: [
      'The documented lab example and newer WebMCP draft APIs may diverge; pin and verify rather than copying code blindly.',
      'Browser hosting and ordinary MCP connectivity do not themselves validate task outcomes or tenant security.',
    ],
    fit: {
      currentUtility: 1,
      integrationPath: 2,
      reusableDistribution: 2,
      pilotTractability: 1,
      runtimePotential: 2,
      rationale:
        'Editorial inference, 8/10: explicit MCP and lab WebMCP surfaces offer strong technical complementarity. Current usefulness is conditional on a connection test; experimental runtime work and partner approval reduce immediate pilot readiness.',
    },
    contact: {
      label: 'Technology Partner Program',
      url: 'https://www.cloudflare.com/partners/technology-partners/',
      qualification:
        'Public program page provides an Apply route for technology integrations. Eligibility and acceptance have not been established; no application has been submitted.',
    },
    sources: [
      source(
        'cloudflare-mcp',
        'Agents: MCP tools',
        'https://developers.cloudflare.com/agents/tools/mcp/',
      ),
      source(
        'cloudflare-webmcp',
        'Browser Run: WebMCP Beta',
        'https://developers.cloudflare.com/browser-run/features/webmcp/',
      ),
      source(
        'cloudflare-browser',
        'Browser Run overview',
        'https://developers.cloudflare.com/browser-run/',
      ),
      source(
        'cloudflare-partners',
        'Technology Partner Program',
        'https://www.cloudflare.com/partners/technology-partners/',
      ),
    ],
  },
  {
    slug: 'lovable',
    company: 'Lovable',
    product: 'Builder chat connectors and GitHub sync',
    title: 'Turn an audit finding into a reviewed builder change',
    summary:
      'Proposed design partnership: let a builder request an evidence-backed check, review a supported starter fix, and check the published page again. Avoid promising visibility into an authenticated or client-only application.',
    reviewedAt,
    status: 'prospect-not-contacted',
    context: [
      {
        claim:
          'Lovable documents custom MCP chat connectors. Chat connectors provide building context and are distinct from capabilities embedded in the published application.',
        sourceIds: ['lovable-connectors', 'lovable-custom-mcp'],
      },
      {
        claim:
          'Lovable documents GitHub synchronization and publishing to a live URL, with access settings and optional custom domains.',
        sourceIds: ['lovable-github', 'lovable-publish'],
      },
      {
        claim:
          'Its public partnership page offers a solution-partner application. It does not establish isWebMCP as an approved connector or partner.',
        sourceIds: ['lovable-partners'],
      },
    ],
    integration: [
      'Ask one consenting builder to connect the existing isWebMCP MCP endpoint and test tool discovery. Use a deliberately public example whose relevant form markup is present in the HTTP response.',
      'Return a scoped finding and the corresponding recipe to the builder. The builder or coding agent may propose a change, but the owner reviews, merges, and republishes it through the normal workflow.',
      'Save reports outside the chat and compare only the same final URL, scanner model, complete collection, and input fingerprint. A new publish URL or custom-domain redirect requires a new baseline, not a manufactured improvement.',
    ],
    availableNow: [
      'Remote MCP audit, supplied-contract review, two starter recipes, and compatible before/after source comparisons.',
      'A GitHub Actions option for a connected repository; the scanner still runs on our hosted service, not inside the builder session.',
    ],
    requiresWork: [
      'Verified Lovable connector compatibility and a small builder-specific onboarding guide.',
      'Rendered-browser or authorized private execution before evaluating content absent from public HTML; no automatic repair integration exists today.',
    ],
    pilot: {
      scope:
        'Proposed scope: one builder-owned public demo, one supported form or search improvement, and a second voluntary check after republishing.',
      deliverables: [
        'A connector setup note, a finding-to-recipe prompt, and owner-reviewed before/after artifacts.',
        'A visibility checklist that tells builders when a source scan cannot assess their rendered application.',
      ],
      successSignals: [
        'Record whether the builder can explain the finding, locate the suggested code, and complete a reviewed change.',
        'Count complete and comparable scans, failed calls, and voluntary repeat use; no conversion or revenue outcome is assumed.',
      ],
      stopConditions: [
        'Stop if meaningful content appears only after browser JavaScript or login and therefore is outside the scanner evidence.',
        'Do not treat adding an MCP chat connector as enabling native browser WebMCP in the published app.',
      ],
    },
    risks: [
      'A successful request against an HTML shell can still provide little evidence about the usable application.',
      'Builder permissions, connector availability, and generated code changes need owner review and real integration tests.',
    ],
    fit: {
      currentUtility: 1,
      integrationPath: 2,
      reusableDistribution: 2,
      pilotTractability: 1,
      runtimePotential: 1,
      rationale:
        'Editorial inference, 7/10: documented MCP and GitHub surfaces make a reusable builder workflow plausible, but source visibility and untested host compatibility limit immediate coverage. It wins the tie on reusable builder distribution, not company size.',
    },
    contact: {
      label: 'Lovable partnership opportunities',
      url: 'https://lovable.dev/partners',
      qualification:
        'Use the solution-partner route for a qualified design-pilot inquiry or request routing to integrations. This is not evidence of a self-service connector Marketplace approval path; no message has been sent.',
    },
    sources: [
      source(
        'lovable-connectors',
        'Lovable connector types',
        'https://docs.lovable.dev/integrations/introduction',
      ),
      source(
        'lovable-custom-mcp',
        'Connect a custom MCP server',
        'https://docs.lovable.dev/integrations/custom-mcp',
      ),
      source(
        'lovable-github',
        'Connect a project to GitHub',
        'https://docs.lovable.dev/integrations/github',
      ),
      source(
        'lovable-publish',
        'Publish a Lovable project',
        'https://docs.lovable.dev/features/publish',
      ),
      source(
        'lovable-partners',
        'Partner with Lovable',
        'https://lovable.dev/partners',
      ),
    ],
  },
  {
    slug: 'browserbase',
    company: 'Browserbase',
    product: 'Browser sessions, Playwright, and replay evidence',
    title: 'Design independent evidence for what an agent actually did',
    summary:
      'Proposed research and integration partner: develop a bounded browser-evidence adapter. This addresses an important missing capability, but it is not an integration we can offer customers as complete today.',
    reviewedAt,
    status: 'prospect-not-contacted',
    context: [
      {
        claim:
          'Browserbase documents remote browser sessions usable with Playwright and other automation frameworks.',
        sourceIds: ['browserbase-sessions'],
      },
      {
        claim:
          'Its session-replay documentation describes default recording and an option to disable recording at session creation. Replay credentials must stay server-side.',
        sourceIds: ['browserbase-replay'],
      },
      {
        claim:
          'The public integration submission route requests an introduction draft, quickstart draft, and code link. Browserbase also documents a remote MCP server; that alone does not establish native browser WebMCP support.',
        sourceIds: ['browserbase-partner', 'browserbase-mcp'],
      },
    ],
    integration: [
      'Begin with an owned fixture and a developer-run browser harness, not arbitrary enterprise sites. Collect a source report separately, then assert the visible result of one low-risk search in the browser.',
      'Design an evidence envelope containing task version, browser version, permitted origin, exact assertions, timestamps, and outcome. A recording explains behavior but cannot substitute for an independent correctness assertion.',
      'Test browser feature availability before attempting native WebMCP execution. Browser automation exposed through an MCP server is a different mechanism; missing native support must be reported as unsupported, not silently emulated.',
    ],
    availableNow: [
      'Existing source baselines, supplied-contract lint, and starter recipes can seed a carefully scoped fixture experiment.',
      'The current source comparator can compare eligible source artifacts only; it cannot consume replay files or certify a browser task.',
    ],
    requiresWork: [
      'A real browser adapter and independent outcome assertions, with cancellation, allowlisted origins, timeouts, and action approval.',
      'Credential isolation, explicit recording consent, retention/deletion controls, cost caps, and a runtime evidence export format.',
    ],
    pilot: {
      scope:
        'Proposed scope: a small technical spike on one owned search fixture, using a consenting partner account and a pre-agreed spending cap. No production customer sessions.',
      deliverables: [
        'A runnable adapter prototype with failing, passing, cancelled, and unsupported test cases.',
        'A scrubbed example evidence record plus introduction and quickstart drafts for eventual integration review.',
      ],
      successSignals: [
        'Check that deliberately wrong search results fail the independent assertion even when the tool call succeeds.',
        'Measure assertion reproducibility, artifact completeness, run duration, and actual browser cost; do not invent savings.',
      ],
      stopConditions: [
        'Stop before execution if permission, recording policy, browser compatibility, or budget is unresolved.',
        'Do not publish sessions, credentials, or third-party content; never enable anti-bot evasion to complete a test.',
      ],
    },
    risks: [
      'A future runtime adapter needs significant work; treating this prospect as a shipped feature would mislead users.',
      'Recorded sessions may contain sensitive data. A browser vendor capability is not an isWebMCP governance guarantee.',
    ],
    fit: {
      currentUtility: 1,
      integrationPath: 2,
      reusableDistribution: 1,
      pilotTractability: 1,
      runtimePotential: 2,
      rationale:
        'Editorial inference, 7/10: selected for the missing independent-runtime-evidence layer, not immediate turnkey coverage. The explicit integration route is useful, but an adapter and privacy review are required; it ranks below Lovable on the distribution tie-break.',
    },
    contact: {
      label: 'Suggest a Browserbase integration',
      url: 'https://www.browserbase.com/partner',
      qualification:
        'Public form asks for introduction, quickstart, and code links. Prepare those artifacts before a formal submission; no form has been filled or submitted.',
    },
    sources: [
      source(
        'browserbase-sessions',
        'Using a browser session',
        'https://docs.browserbase.com/platform/browser/getting-started/using-browser-session',
      ),
      source(
        'browserbase-replay',
        'Session replay and recording controls',
        'https://docs.browserbase.com/platform/browser/observability/session-replay',
      ),
      source(
        'browserbase-integrations',
        'Get started with integrations',
        'https://docs.browserbase.com/integrations/get-started',
      ),
      source(
        'browserbase-partner',
        'Partner with Browserbase',
        'https://www.browserbase.com/partner',
      ),
      source(
        'browserbase-mcp',
        'Browserbase MCP server',
        'https://docs.browserbase.com/integrations/mcp/introduction',
      ),
    ],
  },
  {
    slug: 'godaddy',
    company: 'GoDaddy',
    product: 'Agency workflows and Websites + Marketing',
    title: 'Give agencies a repeatable public-page improvement service',
    summary:
      'Proposed channel pilot: an agency uses source findings and reviewed fixes in a client handoff. Start with owner-approved public pages, not a claim of an official GoDaddy dashboard extension or automatic site repair.',
    reviewedAt,
    status: 'prospect-not-contacted',
    context: [
      {
        claim:
          'GoDaddy describes an Agency Partner Program and a central Hub for agency tools. Its stated entry requirements include being a GoDaddy customer using the Hub and showing agency service capability.',
        sourceIds: ['godaddy-agencies'],
      },
      {
        claim:
          'Websites + Marketing documentation permits custom HTML, CSS, and JavaScript sections, while warning that embedded code can affect site behavior.',
        sourceIds: ['godaddy-custom-code'],
      },
      {
        claim:
          'A developer platform provides domain and commerce APIs. That is not evidence of an API for rewriting website-builder pages or installing a browser WebMCP adapter.',
        sourceIds: ['godaddy-developers'],
      },
    ],
    integration: [
      'An agency and its client approve a short list of already-public pages. Run bounded individual checks and present the exact source limitation with each recommendation; do not crawl a client portfolio.',
      'The agency maps findings to changes supported by the actual product: an editable form label, a reviewed custom section, or a developer-owned component. Verify frame boundaries and script behavior before considering any search-tool adapter.',
      'After the client approves publication, repeat the same URL and analysis inputs. Package the saved JSON and a plain-language change note into the agency handoff; do not sell a badge as certification.',
    ],
    availableNow: [
      'A public-page audit, supported starter code, and local before/after report comparison usable by an agency today.',
      'A manual report-and-remediation workflow that does not need access to the client GoDaddy account.',
    ],
    requiresWork: [
      'Product-specific recipe validation; a custom-code section does not guarantee access to the main document or built-in application behavior.',
      'A genuine agency design partner, explicit client consent, and any separately approved dashboard integration. No such integration has been built.',
    ],
    pilot: {
      scope:
        'Proposed scope: one consenting agency, one consenting client, and one public lead-generation page with a supported source-level improvement.',
      deliverables: [
        'An agency checklist, client-readable findings, and a reviewed remediation handoff.',
        'Baseline/current JSON plus an applicability matrix separating Websites + Marketing from developer-controlled hosting.',
      ],
      successSignals: [
        'Measure agency setup time, supported versus unsupported recommendations, and accepted fixes with denominators.',
        'Ask whether the agency repeats the workflow in a subsequent maintenance cycle; do not assume client leads or revenue increase.',
      ],
      stopConditions: [
        'Stop if the builder cannot safely apply the proposed change or important content is inside an inaccessible frame.',
        'Do not change accounts, DNS, access settings, or client code without the owner’s separate approval.',
      ],
    },
    risks: [
      'An agency program is not a technology Marketplace; isWebMCP eligibility and vendor-level sponsorship are unconfirmed.',
      'Different GoDaddy products expose different customization surfaces. One working example must not become a universal support claim.',
    ],
    fit: {
      currentUtility: 1,
      integrationPath: 1,
      reusableDistribution: 2,
      pilotTractability: 1,
      runtimePotential: 0,
      rationale:
        'Editorial inference, 5/10: a repeatable agency service is plausible, but builder customization and program eligibility constrain the route. Included as the requested agency-channel hypothesis, not because scale proves adoption or technical readiness.',
    },
    contact: {
      label: 'GoDaddy Agency Partner Program',
      url: 'https://www.godaddy.com/pro/agency-partners',
      qualification:
        'A public application route exists for qualified agencies using GoDaddy and the Hub. First establish fit or seek an existing agency collaborator; this is not a verified technology-integration intake.',
    },
    sources: [
      source(
        'godaddy-agencies',
        'Agency Partner Program and eligibility',
        'https://www.godaddy.com/pro/agency-partners',
      ),
      source(
        'godaddy-custom-code',
        'Add HTML or custom code to a site',
        'https://www.godaddy.com/en-ca/help/add-html-or-custom-code-to-my-site-27252',
      ),
      source(
        'godaddy-developers',
        'GoDaddy developer platform',
        'https://developer.godaddy.com/en',
      ),
    ],
  },
];
