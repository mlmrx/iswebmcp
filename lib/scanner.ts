import { calculateWeightedScore } from '@/lib/scoring';
import type {
  ActionCandidate,
  Evidence,
  Finding,
  ScanCounts,
  ScanReport,
  ScoreCategory,
} from '@/lib/types';

const ACTION_WORDS = [
  'search',
  'filter',
  'compare',
  'add',
  'reserve',
  'book',
  'submit',
  'save',
  'export',
  'download',
  'contact',
  'sign in',
  'log in',
  'apply',
  'create',
  'upload',
  'checkout',
  'purchase',
  'delete',
  'pay',
  'send',
];

const countMatches = (html: string, pattern: RegExp) =>
  Array.from(html.matchAll(pattern)).length;

const countPhrase = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => `${count} ${count === 1 ? singular : plural}`;

function detectAction(value: string): string | undefined {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const padded = ` ${normalized} `;
  return ACTION_WORDS.find((word) => padded.includes(` ${word} `));
}

function renderedMarkup(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(
      /<(script|style|template|noscript|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
      ' ',
    );
}

function executableScriptSource(html: string): string {
  return Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
    .filter(
      (match) => !/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1]),
    )
    .map((match) => match[2])
    .join('\n');
}

function decodeEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (match, name: string) => entities[name.toLowerCase()] ?? match,
    );
}

function safeText(value: string, max = 220): string {
  const cleaned = decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, max);
}

function extractAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function getCounts(html: string): ScanCounts {
  const visible = renderedMarkup(html);
  return {
    forms: countMatches(visible, /<form\b[^>]*>/gi),
    inputs: countMatches(visible, /<input\b[^>]*>/gi),
    buttons: countMatches(visible, /<button\b[^>]*>/gi),
    links: countMatches(visible, /<a\b[^>]*href\s*=/gi),
    selects: countMatches(visible, /<select\b[^>]*>/gi),
    textareas: countMatches(visible, /<textarea\b[^>]*>/gi),
    labels: countMatches(visible, /<label\b[^>]*>/gi),
    structuredData: countMatches(
      html,
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/gi,
    ),
    headings: countMatches(visible, /<h[1-6]\b[^>]*>/gi),
  };
}

function extractActionCandidates(
  html: string,
  evidenceId: string,
): ActionCandidate[] {
  const visible = renderedMarkup(html);
  const candidates = new Map<string, ActionCandidate>();
  const tagPattern =
    /<button\b[^>]*>[\s\S]*?<\/button>|<a\b[^>]*>[\s\S]*?<\/a>|<form\b[^>]*>|<input\b[^>]*>/gi;

  for (const match of visible.matchAll(tagPattern)) {
    const tag = match[0];
    const text = [
      safeText(tag, 100),
      extractAttribute(tag, 'aria-label'),
      extractAttribute(tag, 'title'),
      extractAttribute(tag, 'name'),
      extractAttribute(tag, 'value'),
      extractAttribute(tag, 'placeholder'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const action = detectAction(text);
    if (!action || candidates.has(action)) continue;
    const consequential = /(purchase|checkout|delete|send|pay)/.test(text);
    const write =
      /(add|reserve|book|submit|save|contact|apply|create|upload|send)/.test(
        action,
      );
    candidates.set(action, {
      id: `action-${action.replace(/\s+/g, '-')}`,
      name: action.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      purpose: `A source-visible control appears to support ${action}.`,
      sourceEvidenceIds: [evidenceId],
      humanUiAvailable: true,
      agentUiConfidence:
        tag.startsWith('<button') || tag.startsWith('<form')
          ? 'high'
          : 'medium',
      webmcpStatus: 'unknown',
      risk: consequential
        ? 'consequential_write'
        : write
          ? 'reversible_write'
          : 'read',
    });
  }
  return Array.from(candidates.values()).slice(0, 10);
}

function namedControlStats(html: string): { total: number; named: number } {
  const visible = renderedMarkup(html);
  const inputs = Array.from(
    visible.matchAll(/<(input|select|textarea)\b[^>]*>/gi),
  ).map((match) => match[0]);
  const labelFors = new Set(
    Array.from(
      visible.matchAll(
        /<label\b[^>]*\bfor\s*=\s*(?:["']([^"']+)["']|([^\s>]+))[^>]*>/gi,
      ),
    ).map((match) => match[1] ?? match[2]),
  );
  const wrappingLabelControls = new Set(
    Array.from(
      visible.matchAll(
        /<label\b[^>]*>[\s\S]*?(<(?:input|select|textarea)\b[^>]*>)[\s\S]*?<\/label>/gi,
      ),
    ).map((match) => match[1].replace(/\s+/g, ' ').trim().toLowerCase()),
  );
  const assessable = inputs.filter((tag) => {
    const type = extractAttribute(tag, 'type')?.toLowerCase();
    return !['hidden', 'submit', 'button', 'reset', 'image'].includes(
      type ?? '',
    );
  });
  const named = assessable.filter((tag) => {
    const id = extractAttribute(tag, 'id');
    return Boolean(
      extractAttribute(tag, 'aria-label') ||
      extractAttribute(tag, 'aria-labelledby') ||
      extractAttribute(tag, 'title') ||
      (id && labelFors.has(id)) ||
      wrappingLabelControls.has(tag.replace(/\s+/g, ' ').trim().toLowerCase()),
    );
  }).length;
  return { total: assessable.length, named };
}

function makeCategories(
  html: string,
  counts: ScanCounts,
  transport: { initialHttps: boolean; finalHttps: boolean },
  actions: ActionCandidate[],
): ScoreCategory[] {
  const visible = renderedMarkup(html);
  const interactive =
    counts.inputs +
    counts.buttons +
    counts.selects +
    counts.textareas +
    counts.forms;
  const names = namedControlStats(visible);
  const formsWithMethod = countMatches(visible, /<form\b[^>]*method\s*=/gi);
  const formsWithAction = countMatches(visible, /<form\b[^>]*action\s*=/gi);
  const submitControls = countMatches(
    visible,
    /<(button\b[^>]*type\s*=\s*["']?submit|input\b[^>]*type\s*=\s*["']?submit)/gi,
  );
  const feedbackSignals = countMatches(
    visible,
    /(aria-live\s*=|role\s*=\s*["'](?:status|alert)|\bsuccess\b|\bconfirmation\b|\bcompleted\b)/gi,
  );

  const semanticScore = interactive
    ? Math.min(
        100,
        45 + Math.min(interactive, 12) * 3 + Math.min(counts.forms, 3) * 7,
      )
    : counts.links
      ? 45
      : 20;
  const accessibleScore = names.total
    ? Math.round((names.named / names.total) * 100)
    : counts.buttons
      ? 60
      : null;
  const formScore = counts.forms
    ? Math.min(
        100,
        30 +
          Math.round((formsWithMethod / counts.forms) * 20) +
          Math.round((formsWithAction / counts.forms) * 20) +
          Math.min(submitControls, counts.forms) * 30,
      )
    : actions.length
      ? 55
      : null;
  const feedbackScore = interactive
    ? Math.min(100, 25 + feedbackSignals * 22)
    : null;
  const entityScore = Math.min(
    100,
    25 +
      Math.min(counts.headings, 5) * 8 +
      Math.min(counts.structuredData, 2) * 25 +
      Math.min(actions.length, 4) * 4,
  );

  const category = (
    id: string,
    label: string,
    weight: number,
    score: number | null,
    explanation: string,
  ): ScoreCategory => ({
    id,
    label,
    weight,
    score,
    status:
      score === null
        ? 'not_observed'
        : score >= 80
          ? 'pass'
          : score >= 50
            ? 'partial'
            : 'fail',
    explanation,
  });

  return [
    category(
      'semantics',
      'Semantic interactive structure',
      20,
      semanticScore,
      `${countPhrase(interactive, 'semantic interactive element')} ${interactive === 1 ? 'was' : 'were'} source-visible.`,
    ),
    category(
      'accessible_names',
      'Accessible names and relationships',
      20,
      accessibleScore,
      names.total
        ? `${names.named} of ${names.total} form controls had an explicit source-visible accessible name.`
        : 'No source-visible form fields were available to assess.',
    ),
    category(
      'form_clarity',
      'Form and action clarity',
      20,
      formScore,
      counts.forms
        ? `${counts.forms} form${counts.forms === 1 ? '' : 's'} and ${submitControls} explicit submit control${submitControls === 1 ? '' : 's'} were observed.`
        : 'No form contract was source-visible; action controls were assessed when possible.',
    ),
    category(
      'feedback',
      'Predictable state and feedback',
      15,
      feedbackScore,
      interactive
        ? `${feedbackSignals} source-visible status or confirmation affordance${feedbackSignals === 1 ? '' : 's'} were observed.`
        : 'State feedback could not be assessed without a source-visible interaction.',
    ),
    category(
      'entities',
      'Task-oriented content and entities',
      15,
      entityScore,
      `${countPhrase(counts.headings, 'heading')}, ${countPhrase(counts.structuredData, 'structured-data block')}, and ${countPhrase(actions.length, 'action candidate')} were observed.`,
    ),
    category(
      'transport',
      'Visible security and transport',
      10,
      transport.initialHttps && transport.finalHttps
        ? 100
        : transport.finalHttps
          ? 65
          : 20,
      transport.initialHttps && transport.finalHttps
        ? 'The requested and final page URLs use HTTPS.'
        : transport.finalHttps
          ? 'The HTTP request redirected to HTTPS; the initial transport was not encrypted.'
          : 'The scanned page uses HTTP; transport is not encrypted.',
    ),
  ];
}

function topRecommendations(findings: Finding[]) {
  return findings
    .filter(
      (finding) =>
        finding.status !== 'pass' && finding.status !== 'not_applicable',
    )
    .sort(
      (a, b) =>
        ['P0', 'P1', 'P2'].indexOf(a.priority) -
        ['P0', 'P1', 'P2'].indexOf(b.priority),
    )
    .slice(0, 5)
    .map((finding) => ({
      priority: finding.priority,
      title: finding.title,
      detail: finding.recommendation,
    }));
}

export interface AnalyzeInput {
  normalizedUrl: string;
  finalUrl: string;
  goal?: string;
  html: string;
  status: number;
  contentType: string;
  bytesRead: number;
  redirects: number;
  queryRedacted?: boolean;
  now?: Date;
}

export function analyzeSource(input: AnalyzeInput): ScanReport {
  const now = input.now ?? new Date();
  const observedAt = now.toISOString();
  const counts = getCounts(input.html);
  const visible = renderedMarkup(input.html);
  const scriptSource = executableScriptSource(input.html);
  const scriptHints = Array.from(
    scriptSource.matchAll(/(?:document\.modelContext|\.registerTool\s*\()/gi),
  );
  const attributeHints = Array.from(
    visible.matchAll(/\s(?:toolname|tooldescription)\s*=/gi),
  );
  const sourceHints = [...scriptHints, ...attributeHints];
  const evidence: Evidence[] = [];
  const addEvidence = (
    id: string,
    category: string,
    summary: string,
    detail: string,
    confidence: Evidence['confidence'] = 'high',
  ) => {
    evidence.push({
      id,
      source: 'source',
      category,
      summary,
      detail: safeText(detail),
      confidence,
      observedAt,
    });
  };

  addEvidence(
    'ev-transport',
    'transport',
    input.normalizedUrl.startsWith('https:') &&
      input.finalUrl.startsWith('https:')
      ? 'HTTPS page reached end to end'
      : input.finalUrl.startsWith('https:')
        ? 'HTTP entry redirected to HTTPS'
        : 'HTTP page reached',
    `The request began over ${input.normalizedUrl.startsWith('https:') ? 'HTTPS' : 'HTTP'} and ended over ${input.finalUrl.startsWith('https:') ? 'HTTPS' : 'HTTP'}. The server returned HTTP ${input.status} with content type ${input.contentType.split(';')[0] || 'unknown'}.`,
  );
  addEvidence(
    'ev-controls',
    'action_surface',
    `${countPhrase(counts.forms + counts.inputs + counts.buttons + counts.selects + counts.textareas, 'semantic control')} found`,
    `${countPhrase(counts.forms, 'form')}, ${countPhrase(counts.inputs, 'input')}, ${countPhrase(counts.buttons, 'button')}, ${countPhrase(counts.selects, 'select')}, ${countPhrase(counts.textareas, 'textarea')}, and ${countPhrase(counts.links, 'link')} were present in fetched source.`,
  );
  if (counts.labels || counts.inputs || counts.selects || counts.textareas) {
    const names = namedControlStats(input.html);
    addEvidence(
      'ev-names',
      'accessibility',
      `${names.named} of ${names.total} fields explicitly named`,
      `${countPhrase(counts.labels, 'label element')} ${counts.labels === 1 ? 'was' : 'were'} found. Explicit names include label-for relationships and aria labeling visible in source.`,
      names.total && names.named === names.total ? 'high' : 'medium',
    );
  }
  if (counts.structuredData) {
    addEvidence(
      'ev-entities',
      'entities',
      'Structured entity data found',
      `${countPhrase(counts.structuredData, 'JSON-LD block')} ${counts.structuredData === 1 ? 'was' : 'were'} source-visible.`,
    );
  }
  if (sourceHints.length) {
    addEvidence(
      'ev-webmcp-hint',
      'webmcp',
      'WebMCP source hint detected',
      `Found ${sourceHints.length} source reference${sourceHints.length === 1 ? '' : 's'}, including “${safeText(sourceHints[0][0], 80)}”. This is not runtime proof.`,
      'medium',
    );
  }

  const sourceActions = extractActionCandidates(input.html, 'ev-controls');
  if (sourceActions.length) {
    addEvidence(
      'ev-actions',
      'action_surface',
      `${sourceActions.length} task-oriented action candidate${sourceActions.length === 1 ? '' : 's'} inferred`,
      sourceActions.map((action) => action.name).join(', '),
      'medium',
    );
    sourceActions.forEach((action) => {
      action.sourceEvidenceIds = ['ev-actions'];
    });
  }

  const actions = [...sourceActions];
  const goalText = input.goal ? safeText(input.goal, 300) : '';
  const requestedAction = detectAction(goalText);
  if (goalText) {
    evidence.push({
      id: 'ev-goal',
      source: 'inferred',
      category: 'requested_task',
      summary: requestedAction
        ? `Requested task mentions “${requestedAction}”`
        : 'Requested task supplied',
      detail: `User-supplied goal: ${goalText}`,
      confidence: requestedAction ? 'medium' : 'low',
      observedAt,
    });
  }
  if (
    requestedAction &&
    !actions.some(
      (action) =>
        action.id === `action-${requestedAction.replace(/\s+/g, '-')}`,
    )
  ) {
    actions.push({
      id: `action-${requestedAction.replace(/\s+/g, '-')}`,
      name: requestedAction.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      purpose: `The requested goal mentions ${requestedAction}, but no matching source-visible control was found.`,
      sourceEvidenceIds: ['ev-goal'],
      humanUiAvailable: false,
      agentUiConfidence: 'low',
      webmcpStatus: 'unknown',
      risk: /(checkout|purchase|delete|pay)/.test(requestedAction)
        ? 'consequential_write'
        : 'read',
    });
  }

  const categories = makeCategories(
    input.html,
    counts,
    {
      initialHttps: input.normalizedUrl.startsWith('https:'),
      finalHttps: input.finalUrl.startsWith('https:'),
    },
    sourceActions,
  );
  const baselineActionability = calculateWeightedScore(categories);
  const names = namedControlStats(input.html);
  const feedbackSignals =
    /(aria-live\s*=|role\s*=\s*["'](?:status|alert)|\bsuccess\b|\bconfirmation\b)/i.test(
      visible,
    );

  const findings: Finding[] = [
    {
      id: 'finding-runtime-boundary',
      ruleId: 'EVIDENCE_RUNTIME_BOUNDARY',
      title: 'Runtime WebMCP remains unverified',
      status: 'not_observed',
      severity: 'info',
      evidenceIds: sourceHints.length ? ['ev-webmcp-hint'] : [],
      whyItMatters:
        'A source reference cannot prove that tools register, remain available, or execute successfully in a supported browser.',
      recommendation:
        'Import a sanitized tool inventory or run a same-origin/browser verification to establish runtime evidence.',
      priority: 'P1',
    },
    {
      id: 'finding-names',
      ruleId: 'UI_ACCESSIBLE_NAMES',
      title:
        names.total === 0 || names.named === names.total
          ? 'Form controls have explicit names'
          : 'Some form controls lack explicit names',
      status:
        names.total === 0
          ? 'not_observed'
          : names.named === names.total
            ? 'pass'
            : names.named === 0
              ? 'fail'
              : 'partial',
      severity: names.total > names.named ? 'high' : 'info',
      evidenceIds: evidence.some((item) => item.id === 'ev-names')
        ? ['ev-names']
        : [],
      whyItMatters:
        'Explicit control names improve human accessibility and make UI-based agent interaction less ambiguous.',
      recommendation:
        'Associate every field with a label or an equivalent explicit accessible name.',
      priority: names.total > names.named ? 'P0' : 'P2',
    },
    {
      id: 'finding-feedback',
      ruleId: 'UI_STATE_FEEDBACK',
      title: feedbackSignals
        ? 'State feedback affordances are source-visible'
        : 'State verification is not source-visible',
      status: feedbackSignals
        ? 'pass'
        : sourceActions.length
          ? 'not_observed'
          : 'not_applicable',
      severity: feedbackSignals ? 'info' : 'medium',
      evidenceIds: ['ev-controls'],
      whyItMatters:
        'Agents and people need an observable postcondition to know whether an action succeeded.',
      recommendation:
        'Expose deterministic status, confirmation, or updated state with semantic live-region or status patterns.',
      priority: feedbackSignals ? 'P2' : 'P1',
    },
    {
      id: 'finding-webmcp-contract',
      ruleId: 'WEBMCP_CONTRACT_PROOF',
      title: sourceHints.length
        ? 'A source hint needs contract verification'
        : 'No WebMCP source hint was detected',
      status: sourceHints.length ? 'partial' : 'not_observed',
      severity: 'medium',
      evidenceIds: sourceHints.length ? ['ev-webmcp-hint'] : [],
      whyItMatters:
        'Useful tools need narrow schemas, truthful annotations, observable results, and safe error behavior—not just registration code.',
      recommendation:
        'Test the critical user journey with runtime-registered tools and deterministic state assertions.',
      priority: 'P1',
    },
    {
      id: 'finding-transport',
      ruleId: 'TRANSPORT_HTTPS',
      title:
        input.normalizedUrl.startsWith('https:') &&
        input.finalUrl.startsWith('https:')
          ? 'HTTPS transport observed end to end'
          : input.finalUrl.startsWith('https:')
            ? 'Initial HTTP transport redirected to HTTPS'
            : 'HTTPS transport not observed',
      status:
        input.normalizedUrl.startsWith('https:') &&
        input.finalUrl.startsWith('https:')
          ? 'pass'
          : input.finalUrl.startsWith('https:')
            ? 'partial'
            : 'fail',
      severity:
        input.normalizedUrl.startsWith('https:') &&
        input.finalUrl.startsWith('https:')
          ? 'info'
          : input.finalUrl.startsWith('https:')
            ? 'medium'
            : 'high',
      evidenceIds: ['ev-transport'],
      whyItMatters:
        'WebMCP requires a secure context, and transport security is foundational for trustworthy agent actions.',
      recommendation:
        'Serve the application over HTTPS before testing WebMCP runtime behavior.',
      priority:
        input.normalizedUrl.startsWith('https:') &&
        input.finalUrl.startsWith('https:')
          ? 'P2'
          : input.finalUrl.startsWith('https:')
            ? 'P1'
            : 'P0',
    },
  ];

  const summaryCandidates = [
    evidence.find((item) => item.id === 'ev-actions')?.summary,
    evidence.find((item) => item.id === 'ev-webmcp-hint')?.summary,
    evidence.find((item) => item.id === 'ev-names')?.summary,
    evidence.find((item) => item.id === 'ev-transport')?.summary,
  ].filter((value): value is string => Boolean(value));

  const implementationState = sourceHints.length
    ? 'source_hint_detected'
    : 'not_detected';

  return {
    id: `scan_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    normalizedUrl: input.normalizedUrl,
    finalUrl: input.finalUrl,
    goal: input.goal,
    status: 'complete',
    scannedAt: observedAt,
    response: {
      status: input.status,
      contentType: input.contentType,
      bytesRead: input.bytesRead,
      redirects: input.redirects,
      truncated: false,
    },
    implementationState,
    baselineActionability,
    webmcpQuality: null,
    webmcpLift: null,
    counts,
    evidence,
    findings,
    actionSurface: actions,
    limitations: [
      'Quick Scan fetches public source only; it does not execute the target page’s JavaScript.',
      'Source hints are not proof that WebMCP tools register or work at runtime.',
      'Dynamic controls, authenticated states, shadow DOM, and client-rendered content may be absent.',
      'The score describes observable source evidence and its coverage, not overall product quality.',
      ...(input.queryRedacted
        ? [
            'Query values were used for the fetch but removed from the stored and displayed report URL.',
          ]
        : []),
    ],
    strongestEvidence: summaryCandidates.slice(0, 3),
    recommendations: topRecommendations(findings),
  };
}

export function makeDemoReport(): ScanReport {
  const html = `<!doctype html><html><head><script type="application/ld+json">{"@type":"WebApplication"}</script></head><body><main><h1>Headset research</h1><form action="/search" method="get"><label for="q">Search products</label><input id="q" name="q" type="search"><label for="price">Maximum price</label><input id="price" name="price" type="number"><button type="submit">Search</button></form><button aria-label="Compare selected products">Compare</button><button aria-label="Add selected product to cart">Add to cart</button><p role="status">Cart updated</p><script>if (document.modelContext) { document.modelContext.registerTool({name:'search_products'}) }</script></main></body></html>`;
  return analyzeSource({
    normalizedUrl: 'https://demo.iswebmcp.com/store',
    finalUrl: 'https://demo.iswebmcp.com/store',
    goal: 'Find and compare a noise-canceling headset under $300.',
    html,
    status: 200,
    contentType: 'text/html; charset=utf-8',
    bytesRead: new TextEncoder().encode(html).byteLength,
    redirects: 0,
    now: new Date('2026-08-31T20:26:00.000Z'),
  });
}
