import type { EnterpriseScenario } from './types';

// These are researched opportunity scenarios, never customer evidence or endorsements.
export const enterpriseScenarios: EnterpriseScenario[] = [
  {
    slug: 'cisco-support-discovery',
    company: 'Cisco',
    product: 'Support discovery and Product Information API',
    title: 'Make public support discovery easier to maintain',
    summary:
      'An illustrative pilot for a Cisco digital-experience team: review a public product-support finder, improve supported interface gaps, and attach source evidence to its release. No Cisco deployment has been inspected or evaluated.',
    reviewedAt: '2026-09-05',
    status: 'illustrative-not-validated',
    context: [
      {
        claim:
          'Cisco documents a REST/JSON Product Information API with lookups by product identifier and serial number; returned fields include a product-support-page URL.',
        sourceIds: ['cisco-product-information'],
      },
      {
        claim:
          'Cisco Support APIs require bearer tokens obtained using application credentials. That authenticated API is distinct from a public page and is not accessible through our unauthenticated scanner.',
        sourceIds: ['cisco-support-authentication'],
      },
    ],
    workflow: [
      'A proposed owner is the product-support web team, with an API/security reviewer. They choose one already-public, non-sensitive product-discovery page and a fixed URL that can be measured consistently across releases.',
      'Save a source baseline, triage only findings supported by collected HTML, and adapt the accessible-controls recipe where relevant. A separate search-tool experiment could wrap an owner-controlled search function; it must not expose API credentials or customer serial-number queries.',
      'After the team approves and deploys its own changes, run the same public URL and input context again. Attach the compatible source comparison to the release ticket. Existing Cisco APIs remain the execution layer; isWebMCP does not replace them.',
    ],
    availableNow: [
      'Bounded public-source collection, a saved findings inventory, supported starter recipes, and local CLI comparison of complete compatible reports. The remote MCP interface can explain recipes and compare supplied summaries.',
      'Imported tool-contract review can flag declared interface issues in a sanitized proposed search contract; it does not verify Cisco permissions, live API responses, or successful searches.',
    ],
    requiresWork: [
      'Authenticated support workflows, private-network execution, credential delegation, and browser task verification are not provided. A Cisco-specific search adapter and any browser WebMCP compatibility require owner engineering and separate tests.',
    ],
    pilot: {
      scope:
        'Proposed two-week, owner-consented pilot: one public reference page, one web engineer, one security reviewer, and two approved releases. No network configuration, support-case creation, or customer data.',
      deliverables: [
        'A baseline, a reviewed remediation patch, an after-report, and a decision log that separates confirmed source changes from untested runtime hypotheses.',
      ],
      successSignals: [
        'Proposed acceptance: both releases produce complete, comparable reports; every prioritized finding receives a fix, documented exception, or reproducible false-positive report.',
        'Record setup time and reviewer minutes per finding. Proceed only if the owner identifies at least one useful, non-duplicative release decision; no agent-success or cost-saving result is assumed.',
      ],
      stopConditions: [
        'Stop if the useful journey requires login, serial numbers, sensitive source content, weakened access controls, or an authenticated API call from isWebMCP.',
      ],
    },
    risks: [
      'Rendered search behavior may be absent from fetched HTML. Existing accessibility or API tooling may already address the findings; duplication is a reason not to expand the pilot.',
    ],
    sources: [
      {
        id: 'cisco-product-information',
        title: 'Cisco Support APIs: Product Information',
        url: 'https://developer.cisco.com/docs/support-apis/product-information/',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
      {
        id: 'cisco-support-authentication',
        title: 'Cisco Support APIs: Authentication',
        url: 'https://developer.cisco.com/docs/support-apis/authentication/',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
    ],
  },
  {
    slug: 'akamai-edge-release-evidence',
    company: 'Akamai',
    product: 'Property Manager and public reference properties',
    title: 'Keep source findings attached to edge releases',
    summary:
      'An illustrative pilot for Akamai web-platform engineering: check an owner-approved public reference property after releases and preserve comparable source evidence. This is not an Akamai security assessment or a built-in Akamai integration.',
    reviewedAt: '2026-09-05',
    status: 'illustrative-not-validated',
    context: [
      {
        claim:
          'Akamai Property Manager CLI supports local property-configuration changes and promotion through a pipeline, including staging and production network activation.',
        sourceIds: ['akamai-property-cli'],
      },
      {
        claim:
          'Akamai Sandbox is an isolated environment for testing development property configurations before CDN deployment. It is not a publicly reachable test URL supplied by isWebMCP.',
        sourceIds: ['akamai-sandbox'],
      },
    ],
    workflow: [
      'A proposed owner is an Akamai developer-experience or web-platform team maintaining a public, synthetic reference application. Keep its existing configuration validation and Sandbox tests; add our CLI as an independent evidence step for the approved public URL.',
      'Save a complete source baseline before an owner-controlled release. Recheck that same URL after activation and after the owner confirms the intended version is served. Do not compare a staging hostname with a production hostname: our comparison requires matching final URLs and input contexts.',
      'If a source finding changes, the application owner investigates whether markup, content, delivery, or collection conditions explain it. Supported fixes belong in the application source; do not automatically inject browser tools through edge configuration or weaken bot protection.',
    ],
    availableNow: [
      'Hosted, bounded public-source checks plus a local comparison artifact that identifies new or worsened reported findings. The team retains reports in its own release artifacts rather than relying on durable isWebMCP tenant history.',
      'Accessible-controls and search-tool starter recipes can inform an application patch. They are not EdgeWorkers packages, Property Manager behaviors, or a security-policy generator.',
    ],
    requiresWork: [
      'Private Sandbox connectivity, browser execution, cache-version attestation, and native Akamai pipeline integration remain unbuilt. Source comparisons cannot attribute a regression to the CDN or prove an agent completed a journey.',
    ],
    pilot: {
      scope:
        'Proposed two-week pilot on one consented public reference property with synthetic content, one application owner, and one release engineer. Preserve all existing security and activation approvals.',
      deliverables: [
        'A release-step example, two before/after report pairs from the same URL, and a triage record linking each changed finding to an investigated cause or an explicit unknown.',
      ],
      successSignals: [
        'Proposed acceptance: both report pairs meet comparison requirements; every changed finding is triaged; a deliberately seeded source-level defect in the reference application is detected and then removed.',
        'Measure completed versus blocked scans and reviewer time. Continue only if the owner finds useful application evidence beyond existing configuration checks; these are targets, not measured results.',
      ],
      stopConditions: [
        'Stop if collection requires bypassing a challenge, altering WAF or bot rules, routing into private origins, or making an isolated Sandbox publicly accessible.',
      ],
    },
    risks: [
      'Cache variation, redirects, personalization, and incomplete HTML can invalidate comparisons. The scanner does not measure edge performance, bot-policy correctness, or security effectiveness.',
    ],
    sources: [
      {
        id: 'akamai-property-cli',
        title: 'Akamai Property Manager CLI',
        url: 'https://akamai.github.io/cli-property-manager/',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
      {
        id: 'akamai-sandbox',
        title: 'Akamai: Welcome to Sandbox',
        url: 'https://techdocs.akamai.com/sandbox/docs/introduction-sandbox',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
    ],
  },
  {
    slug: 'microsoft-power-pages-release-check',
    company: 'Microsoft',
    product: 'Power Pages',
    title: 'Add evidence to an already-public Power Pages release',
    summary:
      'An illustrative pilot for a Power Pages engineering or reference-solutions team: review anonymous-page source and check supported fixes after release. Private sites remain private, and no Microsoft product integration is claimed.',
    reviewedAt: '2026-09-05',
    status: 'illustrative-not-validated',
    context: [
      {
        claim:
          'Microsoft documents Power Platform CLI support for putting Power Pages configuration in source control and moving it between environments as part of CI/CD.',
        sourceIds: ['microsoft-pages-cli'],
      },
      {
        claim:
          'Power Pages sites are private by default. Developer-environment sites cannot be made public, and tenant governance can restrict non-production visibility changes.',
        sourceIds: ['microsoft-pages-visibility'],
      },
    ],
    workflow: [
      'A proposed owner is the Power Pages reference-solutions team, supported by a tenant administrator. Select an already-approved public reference site containing only synthetic content; do not expose a development tenant to make the scanner work.',
      'Add a bounded source check after the existing deployment workflow. Save the page findings as a release artifact and route supported label or control issues to the page-template owner. Downloaded Power Pages YAML is not an input to our hosted URL scanner.',
      'Let the owner review and publish its own fix, then repeat the same public URL, scanner model, and input context. Compare within that stable URL; separate environments or newly generated preview URLs need their own baselines.',
    ],
    availableNow: [
      'Public, unauthenticated source findings; accessible-controls guidance; and SDK/CLI source comparisons. A team using GitHub Actions can adapt the existing CI example, subject to approved hosted-service access.',
      'The MCP server can return a supported implementation recipe or compare supplied source summaries. It has no Dataverse privileges and cannot change a site or publish a Power Pages solution.',
    ],
    requiresWork: [
      'Authenticated portal scans, private execution, Dataverse authorization evaluation, a native Power Platform adapter, and browser journey verification are not available. There is no enterprise SSO, tenant report history, or SLA commitment.',
    ],
    pilot: {
      scope:
        'Proposed two-week pilot: one already-public synthetic reference site, three named pages, a page-template engineer, and an administrator who approves scope and hosted data handling.',
      deliverables: [
        'A page inventory, one baseline per URL, an owner-reviewed remediation change, and comparable after-reports retained in the team release system.',
      ],
      successSignals: [
        'Proposed acceptance: all three pages yield complete reports or an explicit unsupported outcome; supported changed pages retain compatible baselines and a documented disposition for every prioritized finding.',
        'Measure initial setup time and whether the team voluntarily reuses the check on a second release. Zero visibility or permission changes is a mandatory boundary, not an achieved result.',
      ],
      stopConditions: [
        'Stop if the target is private, requires session cookies, contains sensitive records, or needs tenant restrictions relaxed. Do not treat an inaccessible page as an agent-readiness failure.',
      ],
    },
    risks: [
      'Anonymous HTML does not reveal authenticated forms, Dataverse permissions, or conditional interactions. Existing platform tooling may make the extra source check redundant; the pilot must establish incremental utility.',
    ],
    sources: [
      {
        id: 'microsoft-pages-cli',
        title: 'Microsoft: Power Platform CLI support for Power Pages',
        url: 'https://learn.microsoft.com/en-us/power-pages/configure/power-platform-cli',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
      {
        id: 'microsoft-pages-visibility',
        title: 'Microsoft: Site visibility in Power Pages',
        url: 'https://learn.microsoft.com/en-us/power-pages/security/site-visibility',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
    ],
  },
  {
    slug: 'adobe-public-form-template',
    company: 'Adobe',
    product: 'AEM Forms and Edge Delivery Services',
    title: 'Review form-template changes before repeating them',
    summary:
      'An illustrative pilot for an Adobe AEM Forms reference-team workflow: identify supported source issues in one public form template, review a reusable fix, and check later releases. No conversion improvement or Adobe endorsement is claimed.',
    reviewedAt: '2026-09-05',
    status: 'illustrative-not-validated',
    context: [
      {
        claim:
          'Adobe describes Edge Delivery Services for AEM Forms as supporting multiple authoring approaches and developer customization using HTML, CSS, and JavaScript.',
        sourceIds: ['adobe-eds-forms'],
      },
      {
        claim:
          'Adobe Cloud Manager documents external-repository integration and repository events for pull-request validation, pipeline triggers, and Edge Delivery Services code synchronization.',
        sourceIds: ['adobe-external-repositories'],
      },
    ],
    workflow: [
      'A proposed owner is an AEM Forms developer-experience team maintaining a synthetic enrollment reference. Choose an already-public page and identify whether the actual controls appear in fetched HTML before deciding the scanner is useful.',
      'Check that page after an owner-controlled template deployment, save the complete baseline, and review supported control-label findings. Adapt the accessible-controls recipe in the actual component source; preserve Adobe validation, submission handlers, and existing accessibility tests.',
      'Repeat collection at the same approved URL after the owner ships its patch. Attach source differences to the template change. For a separate catalog-search example, the search-tool recipe is only a starting point; isWebMCP supplies no AEM form-submission adapter.',
    ],
    availableNow: [
      'A bounded public-source findings inventory, supported remediation examples, and a saved report comparison that can accompany an existing GitHub-based release process.',
      'Evidence is about fetched markup and declared contracts only. The team can retain JSON artifacts in its own repository or artifact store; we do not provide a customer-specific Cloud Manager plugin or durable enterprise dashboard.',
    ],
    requiresWork: [
      'Native AEM lifecycle integration, author-instance access, browser evaluation of conditional forms, and verified submission outcomes require additional engineering. No completed-form data should be sent to the scanner.',
    ],
    pilot: {
      scope:
        'Proposed two-week pilot on one owner-approved public reference form, with a template engineer and an accessibility reviewer. Use synthetic labels and content; exclude production leads, signatures, uploads, and form submissions.',
      deliverables: [
        'A source-coverage assessment, a template-level remediation patch if a supported issue exists, before/after JSON evidence, and a documented mapping to the team existing checks.',
      ],
      successSignals: [
        'Proposed acceptance: a deliberately seeded, source-visible label defect in the reference template is detected, corrected, and absent from the subsequent complete report; existing owner tests still pass.',
        'Record review effort and the number of template instances the owner could safely reuse. Continue only after a second release reuses the check without manual report reconstruction; these are pilot targets, not results.',
      ],
      stopConditions: [
        'Stop if useful controls exist only after unsupported browser execution, the reference cannot remain non-sensitive, or a proposed patch would bypass established validation or accessibility controls.',
      ],
    },
    risks: [
      'A source-level fix is not accessibility conformance, form completion, conversion lift, or browser WebMCP support. Template reuse needs explicit owner review; one passing page does not validate a portfolio.',
    ],
    sources: [
      {
        id: 'adobe-eds-forms',
        title: 'Adobe: Edge Delivery Services for AEM Forms',
        url: 'https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/build-forms/overview',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
      {
        id: 'adobe-external-repositories',
        title: 'Adobe: Add external repositories in Cloud Manager',
        url: 'https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/managing-code/external-repositories',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
    ],
  },
  {
    slug: 'salesforce-public-experience-search',
    company: 'Salesforce',
    product: 'Experience Cloud and Lightning Web Components',
    title: 'Evaluate a public content-discovery component',
    summary:
      'An illustrative pilot for an Experience Cloud reference-solutions team: review a public content-discovery page and its proposed search contract. Start with source coverage and platform compatibility, not claims about Agentforce or live CRM automation.',
    reviewedAt: '2026-09-05',
    status: 'illustrative-not-validated',
    context: [
      {
        claim:
          'Salesforce documents custom Lightning Web Components for both Aura and Lightning Web Runtime Experience Cloud sites, including Experience Builder configuration.',
        sourceIds: ['salesforce-experience-components'],
      },
      {
        claim:
          'Published Salesforce CMS content can be displayed in Experience Builder sites through standard components, LWR data binding, or custom Lightning Web Components.',
        sourceIds: ['salesforce-cms-content'],
      },
      {
        claim:
          'Lightning Web Security also protects components in LWR sites, using a site-specific instance rather than the organization setting.',
        sourceIds: ['salesforce-lws'],
      },
    ],
    workflow: [
      'A proposed owner is an Experience Cloud developer-experience team maintaining a public CMS reference application. Select one anonymous, synthetic content-discovery page; first assess whether meaningful controls are present in its fetched HTML.',
      'Save source evidence and review a sanitized proposed search contract. If appropriate, adapt our search-tool recipe to the owner-controlled content lookup. A plain JavaScript recipe is not an installable Lightning component and must pass the owner security and lifecycle review.',
      'After an owner-reviewed component change is published, recheck the same public URL and comparison context. Keep existing component and permission tests. An agent would still need an authorized, compatible browser connection to test the actual task.',
    ],
    availableNow: [
      'Hosted public-source inspection, imported contract lint, accessible-controls and search-tool recipes, and complete compatible before/after source comparisons through the CLI or remote MCP server.',
    ],
    requiresWork: [
      'A Salesforce-specific component adapter, Lightning Web Security compatibility testing, authenticated tenant access, and runtime outcome verification remain unbuilt. We provide no managed package, Agentforce integration, CRM connector, or authorization assessment.',
    ],
    pilot: {
      scope:
        'Proposed two-week pilot: one public synthetic CMS reference page, one component engineer, and a security reviewer. Exclude CRM records, lead creation, case updates, and authenticated content.',
      deliverables: [
        'A source-coverage decision, a reviewed contract proposal, a compatibility checklist, and paired source reports for any owner-approved page fix. Unsupported behavior is recorded, not scored as a completed task.',
      ],
      successSignals: [
        'Proposed acceptance: the owner confirms meaningful source coverage, triages every prioritized finding, and obtains a complete compatible comparison after a supported change.',
        'The security reviewer must accept the proposed adapter boundary before any runtime experiment. Proceed only if a second release reuses the evidence and the owner identifies utility beyond existing component checks.',
      ],
      stopConditions: [
        'Stop if the useful page is an opaque client-rendered shell, requires login, needs security isolation disabled, or exposes non-public CMS or CRM data.',
      ],
    },
    risks: [
      'Source visibility and browser API access are unresolved until an owner-approved pilot. Linting a declared tool does not prove discovery, correct permissions, successful lookup, or compatibility with any Salesforce agent product.',
    ],
    sources: [
      {
        id: 'salesforce-experience-components',
        title:
          'Salesforce: Experience Cloud Sites and Lightning Web Components',
        url: 'https://developer.salesforce.com/docs/platform/lwc/guide/use-experience-cloud-overview.html',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
      {
        id: 'salesforce-cms-content',
        title: 'Salesforce: Display CMS Content in Experience Builder Sites',
        url: 'https://developer.salesforce.com/docs/platform/cms/guide/cms-dev-display-cms-content-in-sites.html',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
      {
        id: 'salesforce-lws',
        title:
          'Salesforce: Experience Builder Sites and Lightning Web Security',
        url: 'https://developer.salesforce.com/docs/platform/lightning-components-security/guide/lws-lms-ec.html',
        publishedAt: null,
        accessedAt: '2026-09-05',
      },
    ],
  },
];
