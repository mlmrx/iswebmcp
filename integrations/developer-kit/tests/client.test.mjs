import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scan,
  compare,
  normalizeTarget,
  validateSummary,
  IsWebMCPError,
} from '../index.mjs';

export function fixture(overrides = {}) {
  const report = {
    summarySchemaVersion: 'iswebmcp-summary/v2',
    comparisonContext: {
      version: 'source-input/v1',
      fingerprint: `sha256:${'a'.repeat(64)}`,
    },
    reportId: 'test-report',
    reportKind: 'observed_source',
    url: 'https://example.com/',
    scannedAt: '2026-09-05T12:00:00Z',
    evidenceScope: 'source-only',
    implementationState: 'not_detected',
    collection: {
      status: 'complete',
      analyzedBytes: 120,
      declaredBytes: null,
      truncated: false,
    },
    actionability: {
      value: 50,
      coverage: 100,
      confidence: 'low',
      interval: null,
      modelVersion: 'test-model-v1',
    },
    counts: {},
    actions: [],
    findings: [
      {
        title: 'Labels',
        status: 'pass',
        severity: 'medium',
        recommendation: 'Keep explicit labels.',
      },
    ],
    recommendations: [],
    limitations: ['Source only'],
    labels: { runtime: 'unknown', lift: 'withheld', contract: 'not-provided' },
    ...overrides,
  };
  report.findings = report.findings.map((finding) => ({
    ruleId: finding.title,
    ...finding,
  }));
  report.findingsCoverage ??= {
    status: 'complete',
    total: report.findings.length,
    returned: report.findings.length,
  };
  return report;
}
const response = (body, status = 201, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });

test('one request uses the actual integration body and strips query/fragment before sending', async () => {
  let calls = 0;
  const report = await scan('https://example.com/page?secret=value#private', {
    goal: '  Find products  ',
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, 'https://iswebmcp.com/api/integrations/scan');
      assert.deepEqual(JSON.parse(options.body), {
        url: 'https://example.com/page',
        goal: 'Find products',
      });
      assert.equal(options.redirect, 'error');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.headers.authorization, undefined);
      return response(fixture());
    },
  });
  assert.equal(calls, 1);
  assert.equal(report.evidenceScope, 'source-only');
});

test('query inclusion is explicit and never includes the fragment', () => {
  assert.equal(
    normalizeTarget('https://example.com/?view=one#private', {
      includeQuery: true,
    }),
    'https://example.com/?view=one',
  );
});

test('rejects credentials, non-web schemes, local targets, IP literals, and Devpost without a request', async () => {
  for (const url of [
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://[::1]',
    'https://user:pass@example.com',
    'file:///x',
    'https://webmcp.devpost.com/participants',
    'https://devpost.com./',
    'example.com',
  ]) {
    await assert.rejects(
      scan(url, { fetch: () => assert.fail('must not fetch') }),
      { code: 'INVALID_INPUT' },
    );
  }
});

test('rejects invalid goal, timeout and endpoint before requesting', async () => {
  for (const options of [
    { goal: 'a'.repeat(301) },
    { timeoutMs: 0 },
    { timeoutMs: 1.5 },
    { endpoint: 'http://example.com/api' },
    { endpoint: 'https://user:pass@example.com' },
  ]) {
    await assert.rejects(
      scan('https://example.com', {
        ...options,
        fetch: () => assert.fail('must not fetch'),
      }),
      { code: 'INVALID_INPUT' },
    );
  }
});

test('reports rate limits with retry metadata and never retries', async () => {
  let calls = 0;
  await assert.rejects(
    scan('https://example.com', {
      fetch: async () => {
        calls++;
        return response(
          { error: { code: 'RATE_LIMITED', message: 'Try later.' } },
          429,
          { 'retry-after': '60' },
        );
      },
    }),
    (error) =>
      error instanceof IsWebMCPError &&
      error.code === 'RATE_LIMITED' &&
      error.status === 429 &&
      error.retryAfter === '60',
  );
  assert.equal(calls, 1);
});

test('reports invalid JSON, oversized body, malformed and synthetic successful responses', async () => {
  for (const result of [
    new Response('not JSON'),
    new Response(' '.repeat(2_000_001)),
    response({}),
    response(fixture({ reportKind: 'synthetic_fixture' })),
    response(fixture({ labels: { runtime: 'verified', lift: 'withheld' } })),
  ]) {
    await assert.rejects(
      scan('https://example.com', { fetch: async () => result }),
      { code: 'INVALID_RESPONSE' },
    );
  }
});

test('preserves HTTP error status even if the service returns HTML', async () => {
  await assert.rejects(
    scan('https://example.com', {
      fetch: async () => new Response('<html>busy</html>', { status: 503 }),
    }),
    { code: 'HTTP_ERROR', status: 503 },
  );
});

test('network failures do not echo sensitive low-level error text', async () => {
  await assert.rejects(
    scan('https://example.com', {
      fetch: async () => {
        throw new Error('secret token');
      },
    }),
    (error) =>
      error.code === 'NETWORK_ERROR' && !error.message.includes('secret'),
  );
});

test('timeouts cancel in-flight fetches', async () => {
  await assert.rejects(
    scan('https://example.com', {
      timeoutMs: 5,
      fetch: (_, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
    }),
    { code: 'TIMEOUT' },
  );
});

test('caller cancellation is distinct from service failure', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    scan('https://example.com', {
      signal: controller.signal,
      fetch: () => assert.fail('must not fetch'),
    }),
    { code: 'ABORTED' },
  );
});

test('same snapshot compares without inventing regressions from score changes', () => {
  const baseline = fixture();
  const current = fixture({
    actionability: { ...baseline.actionability, value: 0 },
  });
  assert.equal(compare(baseline, current).regressed, false);
});

test('detects new, worsened, and severity-escalated source problems', () => {
  const before = fixture({
    findings: [
      {
        title: 'Labels',
        status: 'partial',
        severity: 'low',
        recommendation: 'Label fields.',
      },
    ],
  });
  for (const finding of [
    {
      title: 'Labels',
      status: 'fail',
      severity: 'low',
      recommendation: 'Label fields.',
    },
    {
      title: 'Labels',
      status: 'partial',
      severity: 'high',
      recommendation: 'Label fields.',
    },
    {
      title: 'Forms',
      status: 'partial',
      severity: 'medium',
      recommendation: 'Add forms.',
    },
  ]) {
    const result = compare(before, fixture({ findings: [finding] }));
    assert.equal(result.regressionCount, 1);
    assert.equal(result.regressed, true);
  }
});

test('does not claim missing summary entries were fixed', () => {
  const result = compare(fixture(), fixture({ findings: [] }));
  assert.deepEqual(result.noLongerReported, ['Labels']);
  assert.equal(result.regressed, false);
  assert.match(result.limitations[0], /not evidence of a fix/);
});

test('rejects partial, mismatched, unversioned, or chronologically reversed comparison', () => {
  const baseline = fixture();
  for (const current of [
    fixture({ summarySchemaVersion: undefined }),
    fixture({ summarySchemaVersion: 'future/v2' }),
    fixture({
      actionability: { ...baseline.actionability, modelVersion: null },
    }),
    fixture({
      actionability: { ...baseline.actionability, modelVersion: 'other' },
    }),
    fixture({ collection: { ...baseline.collection, truncated: true } }),
    fixture({ collection: { ...baseline.collection, status: 'partial' } }),
    fixture({ url: 'https://example.com/other' }),
    fixture({ scannedAt: '2026-09-04T00:00:00Z' }),
  ])
    assert.throws(() => compare(baseline, current), { code: 'NOT_COMPARABLE' });
});

test('validates finding statuses and duplicate rule IDs instead of silently passing malformed files', () => {
  assert.throws(
    () =>
      validateSummary(
        fixture({
          findings: [
            {
              title: 'Labels',
              status: 'unknown',
              severity: 'high',
              recommendation: 'Fix',
            },
          ],
        }),
      ),
    { code: 'INVALID_RESPONSE' },
  );
  const duplicate = fixture();
  duplicate.findings.push({ ...duplicate.findings[0] });
  duplicate.findingsCoverage = { status: 'complete', total: 2, returned: 2 };
  assert.throws(() => validateSummary(duplicate), { code: 'INVALID_RESPONSE' });
});

test('legacy summaries remain readable but cannot silently gate a release', () => {
  const legacy = fixture({ summarySchemaVersion: 'iswebmcp-summary/v1' });
  delete legacy.comparisonContext;
  delete legacy.findingsCoverage;
  delete legacy.findings[0].ruleId;
  assert.equal(validateSummary(legacy), legacy);
  assert.throws(() => compare(legacy, fixture()), { code: 'NOT_COMPARABLE' });
});

test('stable rule IDs survive changed titles and duplicate display titles', () => {
  const baseline = fixture();
  const current = fixture({
    findings: [{ ...baseline.findings[0], title: 'Renamed label check' }],
  });
  assert.deepEqual(compare(baseline, current).changes, []);
  const duplicateTitle = fixture({
    findings: [
      { ...baseline.findings[0], ruleId: 'one' },
      { ...baseline.findings[0], ruleId: 'two' },
    ],
  });
  assert.equal(validateSummary(duplicateTitle), duplicateTitle);
});

test('detects problems beyond twelve findings with explicit regression reasons', () => {
  const findings = Array.from({ length: 15 }, (_, index) => ({
    ruleId: `rule-${index}`,
    title: `Rule ${index}`,
    status: 'pass',
    severity: 'medium',
    recommendation: 'Fix this rule.',
  }));
  const baseline = fixture({ findings });
  const current = structuredClone(baseline);
  current.findings[14].status = 'partial';
  let result = compare(baseline, current);
  assert.equal(result.regressionCount, 1);
  assert.deepEqual(result.changes[0].regressionReasons, ['new-problem']);
  const worsened = structuredClone(current);
  worsened.findings[14].status = 'fail';
  worsened.findings[14].severity = 'blocker';
  result = compare(current, worsened);
  assert.deepEqual(result.changes[0].regressionReasons, [
    'status-worsened',
    'severity-increased',
  ]);
});

test('missing context, changed inputs, partial finding inventories, and imports cannot pass CI', () => {
  for (const overrides of [
    { comparisonContext: null },
    {
      comparisonContext: {
        version: 'source-input/v1',
        fingerprint: `sha256:${'b'.repeat(64)}`,
      },
    },
    { findingsCoverage: { status: 'partial', total: 15, returned: 1 } },
    {
      labels: {
        runtime: 'unknown',
        lift: 'withheld',
        contract: 'imported-not-independently-verified',
      },
    },
  ]) {
    assert.throws(() => compare(fixture(), fixture(overrides)), {
      code: 'NOT_COMPARABLE',
    });
  }
});

test('rejects malformed context and dishonest finding coverage', () => {
  for (const overrides of [
    { comparisonContext: undefined },
    {
      comparisonContext: {
        version: 'source-input/v1',
        fingerprint: 'secret-query',
      },
    },
    {
      comparisonContext: {
        version: 'future',
        fingerprint: `sha256:${'a'.repeat(64)}`,
      },
    },
    { findingsCoverage: { status: 'complete', total: 15, returned: 1 } },
    { findingsCoverage: { status: 'partial', total: 15, returned: 0 } },
    { findingsCoverage: { status: 'complete', total: 1.5, returned: 1 } },
    {
      findings: [
        {
          title: 'Labels',
          ruleId: '',
          status: 'pass',
          severity: 'low',
          recommendation: '',
        },
      ],
    },
  ])
    assert.throws(() => validateSummary(fixture(overrides)), {
      code: 'INVALID_RESPONSE',
    });
});

test('validates every declared summary field before exposing the typed SDK result', () => {
  for (const invalidFields of [
    { counts: null },
    { counts: { forms: 'one' } },
    { actions: [{}] },
    { recommendations: [{ title: 'Fix' }] },
    { implementationState: undefined },
    { actionability: { value: 0, coverage: 0 } },
    { collection: { status: 'complete', truncated: false, analyzedBytes: 1 } },
    { labels: { runtime: 'unknown', lift: 'withheld' } },
  ])
    assert.throws(() => validateSummary(fixture(invalidFields)), {
      code: 'INVALID_RESPONSE',
    });
});
