import { isIP } from 'node:net';

export const DEFAULT_ENDPOINT = 'https://iswebmcp.com/api/integrations/scan';
export const SUMMARY_SCHEMA_VERSION = 'iswebmcp-summary/v2';
const MAX_RESPONSE_BYTES = 2_000_000;
const statuses = new Set([
  'pass',
  'partial',
  'fail',
  'not_observed',
  'not_applicable',
]);
const severities = ['info', 'low', 'medium', 'high', 'blocker'];
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export class IsWebMCPError extends Error {
  constructor(code, message, { status, retryAfter } = {}) {
    super(message);
    this.name = 'IsWebMCPError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function invalid(message) {
  throw new IsWebMCPError('INVALID_INPUT', message);
}

/** Normalize before sending; the service remains responsible for DNS/redirect safety. */
export function normalizeTarget(input, { includeQuery = false } = {}) {
  if (typeof input !== 'string' || input.length > 2048)
    invalid('Provide a public HTTP(S) URL up to 2048 characters.');
  let url;
  try {
    url = new URL(input);
  } catch {
    invalid('Provide an absolute public HTTP(S) URL.');
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    invalid('Only public HTTP(S) URLs without credentials are supported.');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const ipHost = host.replace(/^\[|\]$/g, '');
  if (host === 'devpost.com' || host.endsWith('.devpost.com'))
    invalid('Devpost targets are excluded.');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    !host.includes('.') ||
    isIP(ipHost)
  ) {
    invalid(
      'Use a public DNS hostname. Localhost and IP-literal targets are not supported by this client.',
    );
  }
  url.hash = '';
  if (!includeQuery) url.search = '';
  return url.toString();
}

export function validateSummary(value) {
  const fail = () => {
    throw new IsWebMCPError(
      'INVALID_RESPONSE',
      'Expected an isWebMCP public source-scan summary.',
    );
  };
  if (
    !object(value) ||
    value.reportKind !== 'observed_source' ||
    value.evidenceScope !== 'source-only' ||
    (value.summarySchemaVersion !== undefined &&
      typeof value.summarySchemaVersion !== 'string') ||
    typeof value.implementationState !== 'string' ||
    typeof value.reportId !== 'string' ||
    !value.reportId ||
    typeof value.url !== 'string' ||
    typeof value.scannedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.scannedAt)) ||
    !object(value.collection) ||
    !['complete', 'partial'].includes(value.collection.status) ||
    typeof value.collection.truncated !== 'boolean' ||
    !Number.isFinite(value.collection.analyzedBytes) ||
    value.collection.analyzedBytes < 0 ||
    !(
      value.collection.declaredBytes === null ||
      (Number.isFinite(value.collection.declaredBytes) &&
        value.collection.declaredBytes >= 0)
    ) ||
    !object(value.actionability) ||
    !(
      value.actionability.value === null ||
      Number.isFinite(value.actionability.value)
    ) ||
    !Number.isFinite(value.actionability.coverage) ||
    typeof value.actionability.confidence !== 'string' ||
    !(
      value.actionability.modelVersion === undefined ||
      value.actionability.modelVersion === null ||
      typeof value.actionability.modelVersion === 'string'
    ) ||
    !(
      value.actionability.interval === null ||
      (object(value.actionability.interval) &&
        Number.isFinite(value.actionability.interval.lower) &&
        Number.isFinite(value.actionability.interval.upper))
    ) ||
    !object(value.counts) ||
    !Object.values(value.counts).every(
      (count) => Number.isFinite(count) && count >= 0,
    ) ||
    !Array.isArray(value.actions) ||
    !value.actions.every(
      (action) =>
        object(action) &&
        ['name', 'purpose', 'risk', 'agentUiConfidence', 'webmcpStatus'].every(
          (key) => typeof action[key] === 'string',
        ),
    ) ||
    !Array.isArray(value.recommendations) ||
    !value.recommendations.every(
      (item) =>
        object(item) &&
        ['priority', 'title', 'detail'].every(
          (key) => typeof item[key] === 'string',
        ),
    ) ||
    !Array.isArray(value.findings) ||
    !Array.isArray(value.limitations) ||
    !value.limitations.every((item) => typeof item === 'string') ||
    !object(value.labels) ||
    value.labels.runtime !== 'unknown' ||
    value.labels.lift !== 'withheld' ||
    typeof value.labels.contract !== 'string'
  )
    fail();
  try {
    normalizeTarget(value.url);
  } catch {
    fail();
  }
  const version2 = value.summarySchemaVersion === SUMMARY_SCHEMA_VERSION;
  if (version2) {
    const coverage = value.findingsCoverage;
    const context = value.comparisonContext;
    if (
      !object(coverage) ||
      !['complete', 'partial'].includes(coverage.status) ||
      !Number.isSafeInteger(coverage.total) ||
      !Number.isSafeInteger(coverage.returned) ||
      coverage.returned !== value.findings.length ||
      coverage.total < coverage.returned ||
      (coverage.status === 'complete' &&
        coverage.total !== coverage.returned) ||
      !(
        context === null ||
        (object(context) &&
          context.version === 'source-input/v1' &&
          typeof context.fingerprint === 'string' &&
          /^sha256:[a-f0-9]{64}$/.test(context.fingerprint))
      )
    )
      fail();
  }
  const identities = new Set();
  for (const finding of value.findings) {
    const identity = version2 ? finding?.ruleId : finding?.title;
    if (
      !object(finding) ||
      typeof finding.title !== 'string' ||
      !finding.title ||
      typeof identity !== 'string' ||
      !identity.trim() ||
      identities.has(identity) ||
      !statuses.has(finding.status) ||
      !severities.includes(finding.severity) ||
      typeof finding.recommendation !== 'string'
    )
      fail();
    identities.add(identity);
  }
  return value;
}

async function readJson(response) {
  if (!response.body)
    throw new IsWebMCPError(
      'INVALID_RESPONSE',
      'The scan service returned an empty response.',
    );
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new IsWebMCPError(
          'INVALID_RESPONSE',
          'The scan response exceeded the client size limit.',
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new IsWebMCPError(
      'INVALID_RESPONSE',
      'The scan service returned invalid JSON.',
    );
  }
}

/** One bounded POST; no automatic retries, crawling, cookie forwarding, or browser execution. */
export async function scan(
  url,
  {
    goal,
    includeQuery = false,
    timeoutMs = 20_000,
    signal,
    endpoint = DEFAULT_ENDPOINT,
    fetch: fetchImplementation = globalThis.fetch,
  } = {},
) {
  const target = normalizeTarget(url, { includeQuery });
  if (
    goal !== undefined &&
    (typeof goal !== 'string' || goal.trim().length > 300)
  )
    invalid('Goal must be a string up to 300 characters.');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000)
    invalid('Timeout must be between 1 and 120000 milliseconds.');
  let service;
  try {
    service = new URL(endpoint);
  } catch {
    invalid('The scan endpoint must be an absolute HTTPS URL.');
  }
  if (
    service.protocol !== 'https:' ||
    service.username ||
    service.password ||
    service.hash ||
    service.search
  )
    invalid(
      'The scan endpoint must use HTTPS without credentials, queries, or fragments.',
    );
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeout.signal])
    : timeout.signal;
  try {
    combinedSignal.throwIfAborted();
    const response = await fetchImplementation(service.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        url: target,
        ...(goal?.trim() ? { goal: goal.trim() } : {}),
      }),
      credentials: 'omit',
      redirect: 'error',
      signal: combinedSignal,
    });
    let body;
    try {
      body = await readJson(response);
    } catch (error) {
      if (!response.ok && !combinedSignal.aborted) {
        throw new IsWebMCPError(
          'HTTP_ERROR',
          `The scan service returned HTTP ${response.status}.`,
          {
            status: response.status,
            retryAfter: response.headers.get('retry-after') ?? undefined,
          },
        );
      }
      throw error;
    }
    if (!response.ok) {
      throw new IsWebMCPError(
        typeof body?.error?.code === 'string' ? body.error.code : 'HTTP_ERROR',
        typeof body?.error?.message === 'string'
          ? body.error.message
          : `The scan service returned HTTP ${response.status}.`,
        {
          status: response.status,
          retryAfter: response.headers.get('retry-after') ?? undefined,
        },
      );
    }
    return validateSummary(body);
  } catch (error) {
    if (signal?.aborted)
      throw new IsWebMCPError('ABORTED', 'The scan was cancelled.');
    if (timeout.signal.aborted)
      throw new IsWebMCPError(
        'TIMEOUT',
        'The scan exceeded the client timeout.',
      );
    if (error instanceof IsWebMCPError) throw error;
    throw new IsWebMCPError(
      'NETWORK_ERROR',
      'Could not reach the scan service. Check connectivity and try again.',
    );
  } finally {
    clearTimeout(timer);
  }
}

const problemRank = (finding) =>
  ({ partial: 1, fail: 2 })[finding?.status] ?? 0;

/** A deliberately narrow gate over reported source findings, not runtime or score lift. */
export function compare(baseline, current) {
  validateSummary(baseline);
  validateSummary(current);
  const reasons = [];
  if (
    baseline.summarySchemaVersion !== SUMMARY_SCHEMA_VERSION ||
    current.summarySchemaVersion !== SUMMARY_SCHEMA_VERSION
  )
    reasons.push(
      'Comparison requires summary/v2 on both reports. Rescan legacy baselines with the current service.',
    );
  if (
    typeof baseline.actionability.modelVersion !== 'string' ||
    !baseline.actionability.modelVersion ||
    baseline.actionability.modelVersion !== current.actionability.modelVersion
  )
    reasons.push('Both reports must identify the same scoring model version.');
  if (baseline.url !== current.url)
    reasons.push('Both reports must have the same final URL.');
  if (
    !baseline.comparisonContext ||
    !current.comparisonContext ||
    baseline.comparisonContext.version !== current.comparisonContext.version ||
    baseline.comparisonContext.fingerprint !==
      current.comparisonContext.fingerprint
  )
    reasons.push(
      'Both reports must identify the same source input context (requested URL, final URL, query, goal, and analysis limit). Rescan if input context is missing.',
    );
  if (
    [baseline, current].some(
      (report) =>
        !report.findingsCoverage ||
        report.findingsCoverage.status !== 'complete' ||
        report.findingsCoverage.total !== report.findings.length ||
        report.findingsCoverage.returned !== report.findings.length,
    )
  )
    reasons.push(
      'Both reports must contain a complete finding inventory. Partial finding summaries cannot gate releases.',
    );
  if (
    [baseline, current].some(
      (report) => report.labels.contract !== 'not-provided',
    )
  )
    reasons.push(
      'Imported contract audits cannot be used for a source-only comparison. Rescan the public source.',
    );
  if (Date.parse(current.scannedAt) < Date.parse(baseline.scannedAt))
    reasons.push('The current report must not predate the baseline.');
  if (
    [baseline, current].some(
      (report) =>
        report.collection.truncated || report.collection.status !== 'complete',
    )
  )
    reasons.push(
      'Partial source collections cannot be used as a comparison gate.',
    );
  if (reasons.length)
    throw new IsWebMCPError('NOT_COMPARABLE', reasons.join(' '));
  const previous = new Map(
    baseline.findings.map((finding) => [finding.ruleId, finding]),
  );
  const changes = [];
  for (const finding of current.findings) {
    const before = previous.get(finding.ruleId);
    const rank = problemRank(finding);
    const regressionReasons = [];
    if (rank > 0) {
      if (!before || problemRank(before) === 0)
        regressionReasons.push('new-problem');
      else {
        if (rank > problemRank(before))
          regressionReasons.push('status-worsened');
        if (
          severities.indexOf(finding.severity) >
          severities.indexOf(before.severity)
        )
          regressionReasons.push('severity-increased');
      }
    }
    const regressed = regressionReasons.length > 0;
    if (
      !before ||
      before.status !== finding.status ||
      before.severity !== finding.severity
    ) {
      changes.push({
        ruleId: finding.ruleId,
        title: finding.title,
        before: before
          ? { status: before.status, severity: before.severity }
          : null,
        after: { status: finding.status, severity: finding.severity },
        regressed,
        regressionReasons,
        recommendation: finding.recommendation,
      });
    }
  }
  const regressions = changes.filter((change) => change.regressed);
  return {
    schemaVersion: 'iswebmcp-source-comparison/v2',
    evidenceScope: 'source-only',
    baselineReportId: baseline.reportId,
    currentReportId: current.reportId,
    url: current.url,
    modelVersion: current.actionability.modelVersion,
    regressed: regressions.length > 0,
    regressionCount: regressions.length,
    changes,
    noLongerReported: baseline.findings
      .filter(
        (finding) =>
          !current.findings.some((item) => item.ruleId === finding.ruleId),
      )
      .map((finding) => finding.ruleId),
    limitations: [
      'Compares all reported source findings by stable rule ID. Missing findings are not evidence of a fix.',
      'A pass means no new or worsened partial/failing findings in this summary. It does not establish runtime success, safety, WebMCP support, or lift.',
      'Input fingerprints establish equality of declared scan inputs, not authenticity, identical server responses, or user sessions. They are not anonymization; protect saved reports.',
      'WebMCP is experimental. The actionability model is a heuristic, not certification.',
    ],
  };
}
