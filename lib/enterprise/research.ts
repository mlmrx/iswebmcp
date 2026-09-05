import { enterpriseScenarios } from './scenarios';
import { partnerProspects } from './partners';
import type { PartnerProspect } from './types';

export const researchReviewedAt = '2026-09-05';
export const enterpriseDisclosure =
  'Illustrative proposal—not a customer case study. No company trial, endorsement, partnership, or measured outcome is established by this research.';
export const partnerDisclosure =
  'Researched prospect—not an existing partner. Integration fit is our inference from official sources. No outreach has been sent for this shortlist.';

export const fitCriteria = [
  {
    key: 'currentUtility',
    label: 'Current product fit',
    explanation:
      'Can today’s source-check tools provide useful evidence in the proposed workflow?',
  },
  {
    key: 'integrationPath',
    label: 'Documented integration path',
    explanation:
      'Is there an official, concrete extension or automation surface?',
  },
  {
    key: 'reusableDistribution',
    label: 'Reusable integration',
    explanation:
      'Could one integration serve multiple opt-in application teams?',
  },
  {
    key: 'pilotTractability',
    label: 'Pilot feasibility',
    explanation:
      'Can a small consented pilot run without major unbuilt infrastructure?',
  },
  {
    key: 'runtimePotential',
    label: 'Future runtime fit',
    explanation:
      'Is there a plausible path to independently verified browser-task evidence?',
  },
] as const;

export function fitTotal(partner: PartnerProspect) {
  return fitCriteria.reduce(
    (sum, criterion) => sum + partner.fit[criterion.key],
    0,
  );
}

export const rankedPartners = [...partnerProspects].sort(
  (a, b) =>
    fitTotal(b) - fitTotal(a) ||
    b.fit.currentUtility - a.fit.currentUtility ||
    b.fit.reusableDistribution - a.fit.reusableDistribution ||
    a.company.localeCompare(b.company),
);

export const screenedAlternatives = [
  {
    company: 'Webflow',
    url: 'https://developers.webflow.com/apps/docs/marketplace/submitting-your-app',
    title: 'Webflow Marketplace submission',
    rationale:
      'Strong alternative for designer distribution. A dedicated app and review are still needed. Revisit before Browserbase if near-term publishing utility is the only objective.',
  },
  {
    company: 'Shopify',
    url: 'https://shopify.dev/docs/apps/build/online-store/theme-app-extensions',
    title: 'Shopify theme app extensions',
    rationale:
      'A plausible merchant-enabled theme integration. Defer until one safe storefront task and a theme-specific recipe are validated; checkout and customer records are outside an initial pilot.',
  },
  {
    company: 'Checkly',
    url: 'https://www.checklyhq.com/docs/api-reference/checks/create-a-browser-check/',
    title: 'Checkly browser checks',
    rationale:
      'A strong monitoring alternative. Our contribution would need to be distinct source/contract evidence and independent outcome assertions, not a duplicate monitor. Remains in the separate smaller-tool prospect pipeline.',
  },
  {
    company: 'Trigger.dev',
    url: 'https://trigger.dev/docs/config/extensions/playwright',
    title: 'Trigger.dev Playwright extension',
    rationale:
      'A possible later orchestration layer. The existing CI adapter already supports bounded release checks; another scheduler does not supply missing runtime verification.',
  },
] as const;

export const pilotSteps = [
  {
    title: 'Agree on one public workflow',
    detail:
      'Use an already-public page owned by a consenting team. Agree on data handling, a named reviewer, and what counts as a useful finding. Never weaken access controls for a scan.',
  },
  {
    title: 'Save a reviewed baseline',
    detail:
      'Run the hosted source scan through the toolkit. Keep JSON in the team’s own controlled artifact store. A report ID is not durable evidence.',
  },
  {
    title: 'Review and apply one relevant fix',
    detail:
      'A developer checks the recommendation, chooses a supported recipe if appropriate, and implements through the normal change process. No automatic code edits or deployment.',
  },
  {
    title: 'Compare and decide whether to continue',
    detail:
      'Check the same URL with matching inputs, model and complete inventories. Review false alarms, setup effort, actionable findings, and voluntary repeat usage. Task success requires a separate browser trial.',
  },
];

export const pilotWorksheet = `# isWebMCP enterprise pilot worksheet

Status: proposed pilot; no results collected. Complete and retain privately.

## Owner approval
- Application owner and technical reviewer:
- Approved public URL (no secrets in path or query):
- One workflow and known expected result:
- Data-processing approval, including hosted sanitized URL/outcome retention of 90 days, with deletion during subsequent writes:
- Confirmation that no access controls will change for this pilot:
- Allowed request budget, review window, and stop contact:

## Evidence files (owned by the adopting team)
- Baseline artifact location and access policy:
- Current artifact location:
- Comparison artifact location:
- Artifact retention and deletion owner:
- Matching final URL, model version, input fingerprint, complete collection/inventory:

## Human review
- Finding and supporting evidence:
- Relevant recipe, or reason neither current recipe applies:
- Authorized local change and deployment reference:
- Is the finding actionable, a false alarm, or unresolved? Reviewer and rationale:
- Did the same reported issue change? Missing evidence is not proof of a fix:

## Measures to collect, not promised results
- Setup minutes and integration effort:
- Number of reviewed findings, actionable findings, false alarms, and unresolved items:
- Comparable / inconclusive check counts and reasons:
- New or worsened source findings after changes:
- Whether the team voluntarily retained and reused the check:
- Browser task success / latency / interventions: NOT MEASURED unless a separate authorized trial exists:

## Stop / continue
- Stop on sensitive inputs, incomplete evidence, unapproved requests, or no useful source visibility.
- Continue only after a reviewer confirms concrete utility and accepts the operating limits.
- Company name, quotation, logo, and result publication each require explicit written permission.
- No security certification, WebMCP conformance, market-adoption claim, or ROI is inferred from these checks.
`;

export function researchPackMarkdown() {
  const parts = [
    '# isWebMCP enterprise and partner research pack',
    `Reviewed ${researchReviewedAt}. WebMCP remains experimental.`,
    enterpriseDisclosure,
    partnerDisclosure,
    'These five enterprises are selected platform scenarios, not the world’s largest or best customers. The partner list is a bounded editorial shortlist, not a market ranking. Figures below are proposed fit scores or measures to collect, never customer results.',
    '## Available today',
    '[Developer toolkit and downloads](https://iswebmcp.com/developers) · [Supported implementation recipes](https://iswebmcp.com/developers/recipes) · [Privacy and hosted data handling](https://iswebmcp.com/privacy). Review these before any pilot request. Hosted sanitized URL/outcome analytics have a 90-day retention policy, with deletion during subsequent writes.',
    'Hosted bounded public-source scans; Node SDK/CLI; local GitHub Actions adapter; imported contract lint; two starter recipes; same-input source-summary comparisons. CLI scans still send approved inputs to the hosted service. No private runner, general connected-browser verification, SSO/RBAC, tenant history, configurable hosted retention, or SLA is included.',
    '## Proposed pilot workflow',
    ...pilotSteps.map(
      (step, i) => `${i + 1}. **${step.title}:** ${step.detail}`,
    ),
    '## Enterprise opportunity case studies',
  ];
  for (const scenario of enterpriseScenarios) {
    parts.push(
      `### ${scenario.company}: ${scenario.title}`,
      enterpriseDisclosure,
      scenario.summary,
      '#### Documented context',
    );
    for (const fact of scenario.context) {
      const links = fact.sourceIds
        .map((id) => scenario.sources.find((source) => source.id === id))
        .filter((source) => Boolean(source))
        .map((source) => `[${source!.title}](${source!.url})`)
        .join('; ');
      parts.push(`- ${fact.claim} (${links})`);
    }
    for (const [heading, items] of [
      ['Proposed workflow', scenario.workflow],
      ['Available now', scenario.availableNow],
      ['Requires development or agreement', scenario.requiresWork],
      ['Risks and unknowns', scenario.risks],
      ['Proposed deliverables', scenario.pilot.deliverables],
      ['Measures to collect', scenario.pilot.successSignals],
      ['Stop conditions', scenario.pilot.stopConditions],
    ] as const)
      parts.push(`#### ${heading}`, ...items.map((item) => `- ${item}`));
    parts.push(
      `Pilot scope: ${scenario.pilot.scope}`,
      `Public brief: https://iswebmcp.com/enterprise/scenarios/${scenario.slug}`,
      '#### Source ledger',
      ...scenario.sources.map(
        (source) =>
          `- [${source.title}](${source.url}) — publication date: ${source.publishedAt ?? 'not established'}; checked ${source.accessedAt}.`,
      ),
    );
  }
  parts.push(
    '## Five partner prospects',
    'GoDaddy, Lovable and Cloudflare were requested starting points. Vercel and Browserbase were selected from six additional candidates to cover release checks and future runtime evidence. This constrained shortlist does not claim GoDaddy outranks every alternate.',
    'Fit scores are equally weighted editorial judgments, 0–2 per criterion: 0 = weak/unestablished, 1 = conditional, 2 = strong documented fit. Total /10 is not adoption, endorsement, integration validation, or a company-quality score. Ties favor current product fit, then reusable integration, then company name.',
    ...fitCriteria.map(
      (criterion) => `- ${criterion.label}: ${criterion.explanation}`,
    ),
    '### Other candidates screened',
    ...screenedAlternatives.map(
      (candidate) =>
        `- **${candidate.company}:** ${candidate.rationale} [Official integration surface](${candidate.url}). Reviewed ${researchReviewedAt}.`,
    ),
  );
  for (const partner of rankedPartners) {
    parts.push(
      `### ${partner.company}: ${partner.title}`,
      partnerDisclosure,
      partner.summary,
      `Editorial fit: ${fitTotal(partner)}/10. ${partner.fit.rationale}`,
      ...fitCriteria.map(
        (criterion) => `- ${criterion.label}: ${partner.fit[criterion.key]}/2`,
      ),
      '#### Documented context',
    );
    for (const fact of partner.context) {
      const links = fact.sourceIds
        .map((id) => partner.sources.find((source) => source.id === id))
        .filter((source) => Boolean(source))
        .map((source) => `[${source!.title}](${source!.url})`)
        .join('; ');
      parts.push(`- ${fact.claim} (${links})`);
    }
    for (const [heading, items] of [
      ['Proposed integration', partner.integration],
      ['Available now', partner.availableNow],
      ['Requires development or agreement', partner.requiresWork],
      ['Risks and unknowns', partner.risks],
      ['Proposed deliverables', partner.pilot.deliverables],
      ['Measures to collect', partner.pilot.successSignals],
      ['Stop conditions', partner.pilot.stopConditions],
    ] as const)
      parts.push(`#### ${heading}`, ...items.map((item) => `- ${item}`));
    parts.push(
      `Pilot scope: ${partner.pilot.scope}`,
      `Public route (not contacted): [${partner.contact.label}](${partner.contact.url}). ${partner.contact.qualification}`,
      `Public brief: https://iswebmcp.com/enterprise/partners/${partner.slug}`,
      '#### Source ledger',
      ...partner.sources.map(
        (source) =>
          `- [${source.title}](${source.url}) — publication date: ${source.publishedAt ?? 'not established'}; checked ${source.accessedAt}.`,
      ),
    );
  }
  parts.push(pilotWorksheet);
  return parts.join('\n\n') + '\n';
}
