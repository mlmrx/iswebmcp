import { createHash } from 'node:crypto';
import { analyzeSource } from '../../../lib/scanner';
import type { Finding } from '../../../lib/types';

export const VERSION = '0.1.1';
export const MAX_INPUT_BYTES = 2 * 1024 * 1024;
export const REPORT_SCHEMA = 'iswebmcp-provided-html/v1' as const;
export const MODEL_VERSION = 'provided-html-v1/source-actionability-v2.2';
export const RULE_IDS = [
  'EVIDENCE_RUNTIME_BOUNDARY',
  'UI_ACCESSIBLE_NAMES',
  'UI_STATE_FEEDBACK',
  'WEBMCP_CONTRACT_PROOF',
] as const;
const EXCLUDED_CHECKS = ['TRANSPORT_HTTPS'];
const STATUSES = ['pass', 'partial', 'fail', 'not_observed', 'not_applicable'];
const SEVERITIES = ['info', 'low', 'medium', 'high', 'blocker'];
// oxlint-disable no-control-regex -- Deliberately reject terminal and directional controls in artifact text.
const CONTROL_CHARACTERS =
  /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
// oxlint-enable no-control-regex
// Trusted scanner copy for this pinned profile. Supplied JSON cannot add source text
// or instructions to the default comparison artifact through finding metadata.
const RULE_TEXT: Record<string, { titles: string[]; recommendation: string }> =
  {
    EVIDENCE_RUNTIME_BOUNDARY: {
      titles: ['Runtime WebMCP remains unverified'],
      recommendation:
        'Verify registration and task outcomes separately in an authorized browser. Imported contracts alone are not runtime evidence.',
    },
    UI_ACCESSIBLE_NAMES: {
      titles: [
        'Form controls have explicit names',
        'Some form controls lack explicit names',
      ],
      recommendation:
        'Associate every field with a label or an equivalent explicit accessible name.',
    },
    UI_STATE_FEEDBACK: {
      titles: [
        'State feedback affordances are source-visible',
        'State verification is not source-visible',
      ],
      recommendation:
        'Expose deterministic status, confirmation, or updated state with semantic live-region or status patterns.',
    },
    WEBMCP_CONTRACT_PROOF: {
      titles: [
        'A source hint needs contract verification',
        'No WebMCP source hint was detected',
      ],
      recommendation:
        'Test the critical user journey with runtime-registered tools and deterministic state assertions.',
    },
  };

export const LIMITATIONS = [
  'Private reviewer build: analyzes only the bytes of a user-provided HTML artifact. It does not establish the artifact origin or that it represents the complete page.',
  'No page JavaScript runs and no linked assets, URLs, cookies, or authenticated sessions are retrieved. Exported HTML may omit runtime, shadow-DOM, or authenticated state.',
  'Complete means all applicable checks ran on the entire provided artifact within the fixed input limit. HTTP transport is excluded; no HTTP status, score, or runtime success is asserted.',
  'A source hash binds these supplied bytes at report generation; it is not authenticity, proof of ownership, anonymization, or tamper-proof report signing. Protect reports and choose a non-sensitive app/page identifier.',
  'Source heuristics can be wrong. WebMCP remains experimental; these findings are not certification, security approval, accessibility conformance, or evidence of task success or ROI.',
];

export class PrivateRunnerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PrivateRunnerError';
  }
}

export interface LocalFinding {
  ruleId: string;
  title: string;
  status: Finding['status'];
  severity: Finding['severity'];
  recommendation: string;
}

export interface LocalReport {
  schemaVersion: typeof REPORT_SCHEMA;
  reportKind: 'provided_html';
  acquisition: 'user-supplied';
  sourceScope: 'provided-html-only';
  sourceSha256: string;
  sourceBytes: number;
  analysisLimitBytes: number;
  appId: string;
  analyzedAt: string;
  modelVersion: string;
  findingsCoverage: { status: 'complete'; total: number; returned: number };
  excludedChecks: string[];
  findings: LocalFinding[];
  runtime: 'unknown';
  limitations: string[];
}

const invalid = (
  message = 'Expected a complete private provided-HTML report.',
) => {
  throw new PrivateRunnerError('INVALID_REPORT', message);
};

export function safeText(value: string, max = 800): string {
  return (
    value
      // oxlint-disable-next-line no-control-regex -- Deliberately remove terminal and directional controls before display.
      .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max)
  );
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  );
}

function exactKeys(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  return (
    plainObject(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function safeString(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= max &&
    value.trim() === value &&
    !CONTROL_CHARACTERS.test(value)
  );
}

export function validateAppId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(value)) {
    throw new PrivateRunnerError(
      'INVALID_APP_ID',
      'Use a non-sensitive app/page ID: a lowercase letter followed by up to 63 lowercase letters, digits, underscores, or hyphens.',
    );
  }
}

function canonicalDate(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

export function decodeUtf8(bytes: Uint8Array): string {
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_INPUT_BYTES) {
    throw new PrivateRunnerError(
      'INVALID_SIZE',
      'Provide a nonempty regular file no larger than 2 MiB.',
    );
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new PrivateRunnerError(
      'INVALID_UTF8',
      'Input must contain valid UTF-8 bytes.',
    );
  }
}

/** JSON.parse validates syntax; this bounded lexical pass rejects duplicate keys and deep containers. */
export function parseReportJson(bytes: Uint8Array): unknown {
  const text = decodeUtf8(bytes);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new PrivateRunnerError(
      'INVALID_JSON',
      'Input must be a valid private-report JSON document.',
    );
  }
  const stack: Array<{
    object: boolean;
    expectsKey: boolean;
    keys: Set<string>;
  }> = [];
  const tokens =
    /"(?:\\.|[^"\\])*"|[{}[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g;
  for (const match of text.matchAll(tokens)) {
    const token = match[0];
    if (token === '{' || token === '[') {
      stack.push({
        object: token === '{',
        expectsKey: token === '{',
        keys: new Set(),
      });
      if (stack.length > 16)
        throw new PrivateRunnerError(
          'INVALID_JSON',
          'JSON nesting exceeds the private report format.',
        );
    } else if (token === '}' || token === ']') {
      stack.pop();
    } else {
      const frame = stack.at(-1);
      if (frame?.object && token === ',') frame.expectsKey = true;
      else if (frame?.object && token === ':') frame.expectsKey = false;
      else if (frame?.object && frame.expectsKey && token.startsWith('"')) {
        const key = JSON.parse(token) as string;
        if (frame.keys.has(key))
          throw new PrivateRunnerError(
            'INVALID_JSON',
            'Duplicate JSON object keys are not permitted.',
          );
        frame.keys.add(key);
      }
    }
  }
  return value;
}

export function validateLocalReport(value: unknown): LocalReport {
  if (
    !exactKeys(value, [
      'schemaVersion',
      'reportKind',
      'acquisition',
      'sourceScope',
      'sourceSha256',
      'sourceBytes',
      'analysisLimitBytes',
      'appId',
      'analyzedAt',
      'modelVersion',
      'findingsCoverage',
      'excludedChecks',
      'findings',
      'runtime',
      'limitations',
    ])
  )
    return invalid();
  if (
    value.schemaVersion !== REPORT_SCHEMA ||
    value.reportKind !== 'provided_html' ||
    value.acquisition !== 'user-supplied' ||
    value.sourceScope !== 'provided-html-only' ||
    value.runtime !== 'unknown' ||
    value.modelVersion !== MODEL_VERSION ||
    value.analysisLimitBytes !== MAX_INPUT_BYTES ||
    typeof value.sourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.sourceSha256) ||
    !Number.isSafeInteger(value.sourceBytes) ||
    (value.sourceBytes as number) < 1 ||
    (value.sourceBytes as number) > MAX_INPUT_BYTES ||
    !canonicalDate(value.analyzedAt)
  )
    return invalid();
  validateAppId(value.appId);
  if (
    !exactKeys(value.findingsCoverage, ['status', 'total', 'returned']) ||
    value.findingsCoverage.status !== 'complete' ||
    value.findingsCoverage.total !== RULE_IDS.length ||
    value.findingsCoverage.returned !== RULE_IDS.length ||
    !Array.isArray(value.excludedChecks) ||
    value.excludedChecks.length !== 1 ||
    value.excludedChecks[0] !== 'TRANSPORT_HTTPS' ||
    !Array.isArray(value.findings) ||
    value.findings.length !== RULE_IDS.length ||
    !Array.isArray(value.limitations) ||
    value.limitations.length !== LIMITATIONS.length ||
    !value.limitations.every((item, index) => item === LIMITATIONS[index])
  )
    return invalid();
  const seen = new Set<string>();
  for (const finding of value.findings) {
    if (
      !exactKeys(finding, [
        'ruleId',
        'title',
        'status',
        'severity',
        'recommendation',
      ]) ||
      typeof finding.ruleId !== 'string' ||
      !RULE_IDS.some((rule) => rule === finding.ruleId) ||
      seen.has(finding.ruleId) ||
      !safeString(finding.title, 220) ||
      !safeString(finding.recommendation, 800) ||
      !RULE_TEXT[finding.ruleId].titles.includes(finding.title) ||
      RULE_TEXT[finding.ruleId].recommendation !== finding.recommendation ||
      typeof finding.status !== 'string' ||
      !STATUSES.includes(finding.status) ||
      typeof finding.severity !== 'string' ||
      !SEVERITIES.includes(finding.severity)
    )
      return invalid();
    seen.add(finding.ruleId);
  }
  // No omitted HTTP rule or derived transport state can enter the local evidence profile.
  const runtimeFinding = value.findings.find(
    (finding) => finding.ruleId === 'EVIDENCE_RUNTIME_BOUNDARY',
  );
  if (
    !runtimeFinding ||
    runtimeFinding.status !== 'not_observed' ||
    runtimeFinding.severity !== 'info'
  )
    return invalid();
  return value as unknown as LocalReport;
}

export function auditProvidedHtml(
  bytes: Uint8Array,
  appId: string,
  now = new Date(),
): LocalReport {
  validateAppId(appId);
  const html = decodeUtf8(bytes);
  // oxlint-disable-next-line no-control-regex -- Reject binary C0 bytes, retaining ordinary HTML whitespace.
  if (!html.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(html)) {
    throw new PrivateRunnerError(
      'INVALID_HTML',
      'Provide nonempty UTF-8 HTML, not binary or control-byte data.',
    );
  }
  if (!Number.isFinite(now.getTime()))
    throw new PrivateRunnerError(
      'INVALID_TIME',
      'A valid analysis timestamp is required.',
    );
  // Required internal analyzer arguments only. No request occurs, and its HTTP-derived report is never serialized.
  const analyzed = analyzeSource({
    normalizedUrl: 'https://provided-html.invalid/',
    finalUrl: 'https://provided-html.invalid/',
    html,
    status: 200,
    contentType: 'text/html; charset=utf-8',
    bytesRead: bytes.byteLength,
    declaredBytes: bytes.byteLength,
    analysisLimitBytes: MAX_INPUT_BYTES,
    truncated: false,
    redirects: 0,
    now,
  });
  const expectedRules: string[] = [...RULE_IDS, ...EXCLUDED_CHECKS];
  if (
    analyzed.baselineActionability.modelVersion !==
      'source-actionability-v2.2' ||
    analyzed.findings.length !== expectedRules.length ||
    new Set(analyzed.findings.map((finding) => finding.ruleId)).size !==
      expectedRules.length ||
    analyzed.findings.some((finding) => !expectedRules.includes(finding.ruleId))
  ) {
    throw new PrivateRunnerError(
      'UNSUPPORTED_MODEL',
      'The source analyzer changed. Review and version the private evidence profile before continuing.',
    );
  }
  const findings = analyzed.findings
    .filter((finding) => RULE_IDS.some((rule) => rule === finding.ruleId))
    .map((finding) => ({
      ruleId: finding.ruleId,
      title: safeText(finding.title, 220),
      status: finding.status,
      severity: finding.severity,
      recommendation:
        finding.ruleId === 'EVIDENCE_RUNTIME_BOUNDARY'
          ? RULE_TEXT.EVIDENCE_RUNTIME_BOUNDARY.recommendation
          : safeText(finding.recommendation),
    }));
  return validateLocalReport({
    schemaVersion: REPORT_SCHEMA,
    reportKind: 'provided_html',
    acquisition: 'user-supplied',
    sourceScope: 'provided-html-only',
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    sourceBytes: bytes.byteLength,
    analysisLimitBytes: MAX_INPUT_BYTES,
    appId,
    analyzedAt: now.toISOString(),
    modelVersion: MODEL_VERSION,
    findingsCoverage: {
      status: 'complete',
      total: findings.length,
      returned: findings.length,
    },
    excludedChecks: [...EXCLUDED_CHECKS],
    findings,
    runtime: 'unknown',
    limitations: [...LIMITATIONS],
  });
}

const problemRank = (finding: LocalFinding | undefined): number =>
  finding?.status === 'fail' ? 2 : finding?.status === 'partial' ? 1 : 0;

export function compareLocalReports(
  baselineInput: unknown,
  currentInput: unknown,
) {
  const baseline = validateLocalReport(baselineInput);
  const current = validateLocalReport(currentInput);
  if (
    baseline.appId !== current.appId ||
    baseline.modelVersion !== current.modelVersion ||
    baseline.schemaVersion !== current.schemaVersion ||
    baseline.analysisLimitBytes !== current.analysisLimitBytes
  ) {
    throw new PrivateRunnerError(
      'NOT_COMPARABLE',
      'Reports must identify the same app/page, local schema, model, and analysis limit.',
    );
  }
  if (current.analyzedAt < baseline.analyzedAt)
    throw new PrivateRunnerError(
      'NOT_COMPARABLE',
      'The current report must not predate the baseline.',
    );
  const previous = new Map(
    baseline.findings.map((finding) => [finding.ruleId, finding]),
  );
  const changes = current.findings.flatMap((finding) => {
    const before = previous.get(finding.ruleId);
    const regressionReasons: Array<
      'new-problem' | 'status-worsened' | 'severity-increased'
    > = [];
    if (problemRank(finding) > 0) {
      if (!before || problemRank(before) === 0)
        regressionReasons.push('new-problem');
      else {
        if (problemRank(finding) > problemRank(before))
          regressionReasons.push('status-worsened');
        if (
          SEVERITIES.indexOf(finding.severity) >
          SEVERITIES.indexOf(before.severity)
        )
          regressionReasons.push('severity-increased');
      }
    }
    if (
      before?.status === finding.status &&
      before.severity === finding.severity
    )
      return [];
    return [
      {
        ruleId: finding.ruleId,
        title: finding.title,
        before: before
          ? { status: before.status, severity: before.severity }
          : null,
        after: { status: finding.status, severity: finding.severity },
        regressed: regressionReasons.length > 0,
        regressionReasons,
        recommendation: finding.recommendation,
      },
    ];
  });
  const regressionCount = changes.filter((change) => change.regressed).length;
  return {
    schemaVersion: 'iswebmcp-provided-html-comparison/v1',
    sourceScope: 'provided-html-only',
    inputProvenance: 'user-supplied-reports-not-authenticated',
    appId: current.appId,
    modelVersion: current.modelVersion,
    analysisLimitBytes: MAX_INPUT_BYTES,
    baseline: {
      sourceSha256: baseline.sourceSha256,
      analyzedAt: baseline.analyzedAt,
    },
    current: {
      sourceSha256: current.sourceSha256,
      analyzedAt: current.analyzedAt,
    },
    regressed: regressionCount > 0,
    regressionCount,
    currentProblemCount: current.findings.filter(
      (finding) => problemRank(finding) > 0,
    ).length,
    changes,
    noLongerReported: baseline.findings
      .filter(
        (finding) =>
          !current.findings.some((item) => item.ruleId === finding.ruleId),
      )
      .map((finding) => finding.ruleId),
    runtime: 'unknown',
    limitations: [
      'A clean comparison means no new or worsened partial/failing findings. Existing failures may remain; it is not a release safety or quality approval.',
      'Every status/severity change is shown, but pass-to-not_observed is not gated. A newly detected WebMCP hint can introduce a partial unresolved contract finding.',
      'Missing findings are never proof of a fix. This profile rejects incomplete applicable rule inventories rather than interpreting absent checks as improvements.',
      'Supplied report hashes and app IDs are declarations, not authenticated origins or verified report signatures. These reports have not been reread against the original HTML by comparison.',
      ...LIMITATIONS,
    ],
  };
}
