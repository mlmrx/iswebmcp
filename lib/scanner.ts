import { calculateWeightedScore } from '@/lib/scoring';
import type {
  ActionCandidate,
  Evidence,
  Finding,
  ScanCounts,
  ScanReport,
  ScoreCategory,
  ScoreMetric,
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

// Source heuristic, not an HTML parser or a computed accessibility tree.
// Exclude inert examples before checking scripts, structured data or identity.
function activeSourceMarkup(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(template|noscript|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
}

function renderedMarkup(html: string): string {
  return activeSourceMarkup(html).replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ' ',
  );
}

function executableScriptSource(html: string): string {
  return Array.from(
    activeSourceMarkup(html).matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    ),
  )
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
      activeSourceMarkup(html),
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
      agentUiConfidence: /^<(button|form)\b/i.test(tag) ? 'high' : 'medium',
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

function referencedName(tag: string, visible: string): boolean {
  const ids = decodeEntities(extractAttribute(tag, 'aria-labelledby') ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!ids.length) return false;
  // Lookahead visits nested elements too. Only literal nonempty source text
  // counts here; resolving CSS, shadow roots and full AccName needs a browser.
  for (const match of visible.matchAll(
    /(?=<([a-z][\w:-]*)\b([^>]*)>([\s\S]*?)<\/\1\s*>)/gi,
  )) {
    const id = extractAttribute(`<${match[1]}${match[2]}>`, 'id');
    if (id && ids.includes(decodeEntities(id)) && safeText(match[3]))
      return true;
  }
  return false;
}

function explicitName(tag: string, visible: string): boolean {
  return Boolean(
    safeText(extractAttribute(tag, 'aria-label') ?? '') ||
    referencedName(tag, visible) ||
    safeText(extractAttribute(tag, 'title') ?? ''),
  );
}

function namedControlStats(html: string): { total: number; named: number } {
  const visible = renderedMarkup(html);
  const inputs = Array.from(
    visible.matchAll(/<(input|select|textarea)\b[^>]*>/gi),
  ).map((match) => match[0]);
  const labelFors = new Set(
    Array.from(visible.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi))
      .filter((match) => safeText(match[0]))
      .map((match) => extractAttribute(match[0].split('>')[0] + '>', 'for')),
  );
  const wrappingLabelControls = new Set(
    Array.from(
      visible.matchAll(
        /<label\b[^>]*>[\s\S]*?(<(?:input|select|textarea)\b[^>]*>)[\s\S]*?<\/label>/gi,
      ),
    )
      .filter((match) => safeText(match[0]))
      .map((match) => match[1].replace(/\s+/g, ' ').trim().toLowerCase()),
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
      explicitName(tag, visible) ||
      (id && labelFors.has(id)) ||
      wrappingLabelControls.has(tag.replace(/\s+/g, ' ').trim().toLowerCase()),
    );
  }).length;
  return { total: assessable.length, named };
}

function namedInteractiveStats(html: string): { total: number; named: number } {
  const visible = renderedMarkup(html);
  const controls = Array.from(
    visible.matchAll(
      /<button\b[^>]*>[\s\S]*?<\/button>|<a\b[^>]*href\s*=\s*(?:["'][^"']*["']|[^\s>]+)[^>]*>[\s\S]*?<\/a>/gi,
    ),
  ).map((match) => match[0]);
  const named = controls.filter((tag) =>
    Boolean(safeText(tag, 160) || explicitName(tag, visible)),
  ).length;
  return { total: controls.length, named };
}

function scoreMetric(
  id: string,
  label: string,
  points: number,
  possible: number,
  value: string,
  rationale: string,
  observed = true,
): ScoreMetric {
  return {
    id,
    label,
    observed,
    value,
    points: observed ? Math.max(0, Math.min(possible, points)) : 0,
    possible,
    rationale,
  };
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
  const feedbackSignals = [
    /\saria-live\s*=/i,
    /\srole\s*=\s*["']status["']/i,
    /\srole\s*=\s*["']alert["']/i,
  ].filter((pattern) => pattern.test(visible)).length;
  const namedInteractive = namedInteractiveStats(visible);
  const controlTypes = [
    counts.forms,
    counts.inputs,
    counts.buttons,
    counts.selects,
    counts.textareas,
  ].filter((count) => count > 0).length;
  const landmarks = countMatches(
    visible,
    /<(?:main|nav|header|footer|aside)\b[^>]*>/gi,
  );
  const distinctLandmarkTypes = new Set(
    Array.from(
      visible.matchAll(/<(main|nav|header|footer|aside)\b[^>]*>/gi),
    ).map((match) => match[1].toLowerCase()),
  ).size;
  const stateSignals = [
    /\saria-current\s*=/i,
    /\saria-expanded\s*=/i,
    /\saria-selected\s*=/i,
    /\saria-checked\s*=/i,
    /\saria-busy\s*=/i,
    /\saria-disabled\s*=/i,
    /\sdisabled(?:\s|=|>)/i,
  ].filter((pattern) => pattern.test(visible)).length;
  const hasTitle = /<title\b[^>]*>\s*[^<]+<\/title>/i.test(visible);

  const category = (
    id: string,
    label: string,
    weight: number,
    metrics: ScoreMetric[],
    explanation: string,
  ): ScoreCategory => {
    const observed = metrics.filter((metric) => metric.observed);
    const possible = observed.reduce((sum, metric) => sum + metric.possible, 0);
    const points = observed.reduce((sum, metric) => sum + metric.points, 0);
    const score = possible ? Math.round((points / possible) * 100) : null;
    return {
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
      metrics,
    };
  };

  const semanticMetrics = [
    scoreMetric(
      'native-controls',
      'Native controls present',
      interactive ? 30 : counts.links ? 10 : 0,
      30,
      `${interactive} form/control elements`,
      'Native elements expose more stable semantics than generic clickable containers.',
    ),
    scoreMetric(
      'control-diversity',
      'Control-type diversity',
      controlTypes * 5,
      25,
      `${controlTypes} of 5 source-visible types`,
      'Diversity is rewarded; raw element volume is intentionally not.',
    ),
    scoreMetric(
      'task-actions',
      'Named task actions',
      Math.min(25, actions.length * 8.34),
      25,
      `${actions.length} bounded action candidates`,
      'Only controls with a recognizable action label contribute.',
    ),
    scoreMetric(
      'document-structure',
      'Document structure',
      (landmarks ? 10 : 0) + (counts.headings ? 10 : 0),
      20,
      `${landmarks} landmarks · ${counts.headings} headings`,
      'Landmarks and headings help establish task context.',
    ),
  ];

  const accessibilityMetrics = [
    scoreMetric(
      'field-names',
      'Form-field names',
      names.total ? (names.named / names.total) * 55 : 0,
      55,
      `${names.named} of ${names.total}`,
      'Explicit label relationships and ARIA naming are source-verifiable.',
      names.total > 0,
    ),
    scoreMetric(
      'action-names',
      'Button and link names',
      namedInteractive.total
        ? (namedInteractive.named / namedInteractive.total) * 30
        : 0,
      30,
      `${namedInteractive.named} of ${namedInteractive.total}`,
      'Visible text or an explicit accessible name reduces action ambiguity.',
      namedInteractive.total > 0,
    ),
    scoreMetric(
      'label-elements',
      'Explicit label coverage',
      names.total ? Math.min(1, counts.labels / names.total) * 15 : 0,
      15,
      `${counts.labels} labels for ${names.total} assessable fields`,
      'A label element is a strong, inspectable relationship signal.',
      names.total > 0,
    ),
  ];

  const formMetrics = counts.forms
    ? [
        scoreMetric(
          'submit-coverage',
          'Submit affordances',
          Math.min(1, submitControls / counts.forms) * 25,
          25,
          `${submitControls} submits for ${counts.forms} forms`,
          'A form needs a source-visible way to commit its intent.',
        ),
        scoreMetric(
          'field-contracts',
          'Named form inputs',
          names.total ? (names.named / names.total) * 30 : 0,
          30,
          `${names.named} of ${names.total}`,
          'Named inputs make the form contract understandable.',
          names.total > 0,
        ),
        scoreMetric(
          'form-destination',
          'Method and destination',
          (formsWithMethod / counts.forms) * 10 +
            (formsWithAction / counts.forms) * 10,
          20,
          `${formsWithMethod} methods · ${formsWithAction} actions`,
          'Explicit method and action attributes are evidence, but client-side forms may remain unobserved.',
        ),
        scoreMetric(
          'form-task-labels',
          'Recognizable task labels',
          Math.min(25, actions.length * 8.34),
          25,
          `${actions.length} action candidates`,
          'Task-oriented labels make intent less ambiguous.',
        ),
      ]
    : [
        scoreMetric(
          'standalone-task-labels',
          'Standalone task labels',
          Math.min(100, actions.length * 25),
          100,
          `${actions.length} action candidates · no source-visible form`,
          'Standalone actions are assessed without inventing a form contract.',
          actions.length > 0,
        ),
      ];

  const feedbackMetrics = [
    scoreMetric(
      'live-feedback',
      'Live-region semantics',
      Math.min(45, feedbackSignals * 15),
      45,
      `${feedbackSignals} distinct live-region signal types`,
      'Distinct semantic live-region types expose post-action feedback without rewarding duplicate markup.',
    ),
    scoreMetric(
      'state-attributes',
      'Explicit state attributes',
      Math.min(35, stateSignals * 5),
      35,
      `${stateSignals} distinct state-attribute types`,
      'Distinct ARIA and disabled-state types can expose state transitions without rewarding repetition.',
    ),
    scoreMetric(
      'verification-cap',
      'Source-only verification ceiling',
      feedbackSignals || stateSignals ? 10 : 0,
      20,
      'Runtime behavior not executed',
      'Source hints can earn partial credit but cannot prove feedback works.',
    ),
  ];

  const entityMetrics = [
    scoreMetric(
      'document-identity',
      'Page identity and hierarchy',
      (hasTitle ? 12.5 : 0) + (counts.headings ? 12.5 : 0),
      25,
      `${hasTitle ? 'title present' : 'title absent'} · ${counts.headings} headings`,
      'A named page and heading hierarchy establish task context.',
    ),
    scoreMetric(
      'structured-entities',
      'Structured entity data',
      counts.structuredData ? 30 : 0,
      30,
      `${counts.structuredData} JSON-LD blocks`,
      'Structured-data presence can make entities explicit; duplicate blocks do not add points.',
    ),
    scoreMetric(
      'task-vocabulary',
      'Task vocabulary',
      Math.min(25, actions.length * 8.34),
      25,
      `${actions.length} action candidates`,
      'Recognizable actions connect entities to user goals.',
    ),
    scoreMetric(
      'landmarks',
      'Landmark context',
      Math.min(20, distinctLandmarkTypes * 5),
      20,
      `${distinctLandmarkTypes} distinct types across ${landmarks} landmarks`,
      'Distinct landmark types clarify context; repeated tags do not add points.',
    ),
  ];

  return [
    category(
      'semantics',
      'Semantic interactive structure',
      20,
      semanticMetrics,
      `${countPhrase(interactive, 'semantic interactive element')} were source-visible; diversity and recognizable intent matter more than volume.`,
    ),
    category(
      'accessible_names',
      'Accessible names and relationships',
      20,
      accessibilityMetrics,
      names.total
        ? `${names.named} of ${names.total} form controls had an explicit source-visible accessible name.`
        : 'No source-visible form fields were available to assess.',
    ),
    category(
      'form_clarity',
      'Form and action clarity',
      20,
      formMetrics,
      counts.forms
        ? `${counts.forms} form${counts.forms === 1 ? '' : 's'} and ${submitControls} explicit submit control${submitControls === 1 ? '' : 's'} were observed.`
        : 'No form contract was source-visible; action controls were assessed when possible.',
    ),
    category(
      'feedback',
      'Predictable state and feedback',
      15,
      feedbackMetrics,
      interactive
        ? `${feedbackSignals} source-visible status or confirmation affordance${feedbackSignals === 1 ? '' : 's'} ${feedbackSignals === 1 ? 'was' : 'were'} observed.`
        : 'State feedback could not be assessed without a source-visible interaction.',
    ),
    category(
      'entities',
      'Task-oriented content and entities',
      15,
      entityMetrics,
      `${countPhrase(counts.headings, 'heading')}, ${countPhrase(counts.structuredData, 'structured-data block')}, and ${countPhrase(actions.length, 'action candidate')} were observed.`,
    ),
    category(
      'transport',
      'Visible security and transport',
      10,
      [
        scoreMetric(
          'secure-transport',
          'Secure transport',
          transport.initialHttps && transport.finalHttps
            ? 100
            : transport.finalHttps
              ? 65
              : 20,
          100,
          transport.initialHttps && transport.finalHttps
            ? 'HTTPS requested and reached'
            : transport.finalHttps
              ? 'HTTP redirected to HTTPS'
              : 'HTTP final page',
          'Secure context is foundational, but transport alone does not imply WebMCP readiness.',
        ),
      ],
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
  declaredBytes?: number;
  analysisLimitBytes?: number;
  truncated?: boolean;
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
  if (input.truncated) {
    addEvidence(
      'ev-source-window',
      'source_coverage',
      'Large page analyzed through a bounded source window',
      `${input.bytesRead.toLocaleString()} bytes were analyzed from the start of the response${input.declaredBytes ? `; the response declared ${input.declaredBytes.toLocaleString()} bytes` : ''}. Findings and scores apply only to that bounded window.`,
      'medium',
    );
  }
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
  const baselineActionability = calculateWeightedScore(categories, {
    fullResultUnknown: Boolean(input.truncated),
    modelVersion: 'source-actionability-v2.2',
    confidence: input.truncated ? 'low' : 'medium',
    coverageNote: input.truncated
      ? 'The point estimate and model-input coverage describe only the captured prefix. Unseen markup can raise or lower the complete-page result, so its range is 0–100.'
      : 'Coverage is the observed possible-points share of the source-only scoring model, not whole-product coverage.',
  });
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
    reportKind: 'observed_source',
    normalizedUrl: input.normalizedUrl,
    finalUrl: input.finalUrl,
    goal: input.goal,
    status: 'complete',
    scannedAt: observedAt,
    response: {
      status: input.status,
      contentType: input.contentType,
      bytesRead: input.bytesRead,
      declaredBytes: input.declaredBytes,
      analysisLimitBytes: input.analysisLimitBytes,
      redirects: input.redirects,
      truncated: Boolean(input.truncated),
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
      ...(input.truncated
        ? [
            `The response exceeded the ${(
              input.analysisLimitBytes ?? input.bytesRead
            ).toLocaleString()}-byte analysis window; this partial report does not describe controls beyond the captured prefix.`,
          ]
        : []),
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
  const report = analyzeSource({
    normalizedUrl: 'https://demo.iswebmcp.com/store',
    finalUrl: 'https://demo.iswebmcp.com/store',
    goal: 'Find and compare a noise-canceling headset under $300.',
    html,
    status: 200,
    contentType: 'text/html; charset=utf-8',
    bytesRead: new TextEncoder().encode(html).byteLength,
    declaredBytes: new TextEncoder().encode(html).byteLength,
    analysisLimitBytes: 1_000_000,
    truncated: false,
    redirects: 0,
    now: new Date('2026-08-31T20:26:00.000Z'),
  });
  return {
    ...report,
    reportKind: 'synthetic_fixture',
    limitations: [
      'This sample is an authored synthetic fixture; no third-party website was fetched or observed.',
      ...report.limitations,
    ],
  };
}
