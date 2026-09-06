import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { analyzeSource } from '../../../lib/scanner';
import {
  auditProvidedHtml,
  compareLocalReports,
  decodeUtf8,
  LIMITATIONS,
  MAX_INPUT_BYTES,
  MODEL_VERSION,
  parseReportJson,
  RULE_IDS,
  safeText,
  validateLocalReport,
  type LocalReport,
} from '../src/core';

const beforeHtml =
  '<form><input id="query" name="q"><button>Search</button></form>';
const afterHtml =
  '<form><label for="query">Search</label><input id="query" name="q"><button>Search</button></form>';
const now = new Date('2026-09-05T12:00:00.000Z');
const audit = (html = beforeHtml, time = now) =>
  auditProvidedHtml(Buffer.from(html), 'catalog-search', time);
const finding = (report: LocalReport, ruleId: string) =>
  report.findings.find((item) => item.ruleId === ruleId)!;

void test('actual scanner output is mapped into a distinct complete provided-artifact profile', () => {
  const bytes = Buffer.from(beforeHtml);
  const actual = audit();
  const scanner = analyzeSource({
    normalizedUrl: 'https://fixture.invalid/',
    finalUrl: 'https://fixture.invalid/',
    html: beforeHtml,
    status: 200,
    contentType: 'text/html',
    bytesRead: bytes.length,
    redirects: 0,
    now,
  });
  assert.equal(actual.reportKind, 'provided_html');
  assert.equal(actual.acquisition, 'user-supplied');
  assert.equal(actual.sourceScope, 'provided-html-only');
  assert.equal(
    actual.sourceSha256,
    createHash('sha256').update(bytes).digest('hex'),
  );
  assert.equal(actual.sourceBytes, bytes.length);
  assert.equal(actual.modelVersion, MODEL_VERSION);
  assert.deepEqual(
    actual.findings.map((item) => item.ruleId),
    RULE_IDS,
  );
  assert.deepEqual(actual.excludedChecks, ['TRANSPORT_HTTPS']);
  const localNames = finding(actual, 'UI_ACCESSIBLE_NAMES');
  const originalNames = scanner.findings.find(
    (item) => item.ruleId === 'UI_ACCESSIBLE_NAMES',
  )!;
  for (const key of [
    'ruleId',
    'title',
    'status',
    'severity',
    'recommendation',
  ] as const)
    assert.equal(localNames[key], originalNames[key]);
  const json = JSON.stringify(actual);
  for (const omitted of [
    'observed_source',
    'provided-html.invalid',
    'HTTPS transport observed',
    'baselineActionability',
    'normalizedUrl',
    'contentType',
    'response',
    'score',
  ])
    assert.ok(!json.includes(`"${omitted}"`));
  assert.equal(actual.runtime, 'unknown');
  assert.deepEqual(actual.limitations, LIMITATIONS);
});

void test('real missing-label fix is visible without claiming runtime success', () => {
  const baseline = audit();
  const current = audit(afterHtml, new Date(now.getTime() + 1));
  assert.equal(finding(baseline, 'UI_ACCESSIBLE_NAMES').status, 'fail');
  assert.equal(finding(current, 'UI_ACCESSIBLE_NAMES').status, 'pass');
  const comparison = compareLocalReports(baseline, current);
  assert.equal(comparison.regressed, false);
  assert.equal(comparison.runtime, 'unknown');
  assert.deepEqual(
    comparison.changes.find((item) => item.ruleId === 'UI_ACCESSIBLE_NAMES')
      ?.after,
    { status: 'pass', severity: 'info' },
  );
  assert.deepEqual(comparison.noLongerReported, []);
});

void test('missing label regression is a new problem; unchanged failures remain visible', () => {
  const baseline = audit(afterHtml);
  const current = audit(beforeHtml, new Date(now.getTime() + 1));
  const comparison = compareLocalReports(baseline, current);
  assert.equal(comparison.regressionCount, 1);
  assert.deepEqual(comparison.changes[0].regressionReasons, ['new-problem']);
  const repeated = compareLocalReports(current, {
    ...current,
    analyzedAt: '2026-09-05T12:00:00.002Z',
  });
  assert.equal(repeated.regressed, false);
  assert.equal(repeated.currentProblemCount, 1);
});

void test('status worsening and severity increase both count without using scores', () => {
  const baseline = audit();
  finding(baseline, 'UI_ACCESSIBLE_NAMES').status = 'partial';
  finding(baseline, 'UI_ACCESSIBLE_NAMES').severity = 'medium';
  const current = audit(beforeHtml, new Date(now.getTime() + 1));
  const change = compareLocalReports(baseline, current).changes[0];
  assert.deepEqual(change.regressionReasons, [
    'status-worsened',
    'severity-increased',
  ]);
});

void test('all changes are shown, but partial/fail-only policy is explicit', () => {
  const baseline = audit(`${afterHtml}<p role="status">Ready</p>`);
  const current = audit(
    `${afterHtml}<script>document.modelContext.registerTool({name:"search"})</script>`,
    new Date(now.getTime() + 1),
  );
  const comparison = compareLocalReports(baseline, current);
  assert.equal(
    comparison.changes.find((item) => item.ruleId === 'UI_STATE_FEEDBACK')
      ?.after.status,
    'not_observed',
  );
  assert.equal(
    comparison.changes.find((item) => item.ruleId === 'UI_STATE_FEEDBACK')
      ?.regressed,
    false,
  );
  assert.equal(
    comparison.changes.find((item) => item.ruleId === 'WEBMCP_CONTRACT_PROOF')
      ?.regressed,
    true,
  );
});

void test('unchanged source gives deterministic findings, byte hash, and profile', () => {
  assert.deepEqual(audit(), audit());
  const later = audit(beforeHtml, new Date(now.getTime() + 1));
  assert.deepEqual(later.findings, audit().findings);
  assert.equal(later.sourceSha256, audit().sourceSha256);
});

void test('secret input text, path-like values, links, and HTML are never emitted', () => {
  const secret = 'PRIVATE_customer_finance_TOKEN_123';
  const report = audit(
    `<title>${secret}</title><form action="https://${secret}.invalid/"><input name="${secret}" value="${secret}" placeholder="${secret}"><button>Search ${secret}</button></form><script>fetch('https://${secret}.invalid')</script><!-- C:\\${secret} --><p>goal: ${secret}</p>`,
  );
  const json = JSON.stringify(report);
  assert.ok(!json.includes(secret));
  assert.ok(!json.includes('<form'));
  assert.ok(!json.includes('https://'));
});

void test('invalid bytes, empty input, oversized input and bad identifiers fail closed', () => {
  for (const bytes of [
    Buffer.alloc(0),
    Buffer.alloc(MAX_INPUT_BYTES + 1),
    Buffer.from([0xc3, 0x28]),
    Buffer.from([0xff]),
  ])
    assert.throws(() => auditProvidedHtml(bytes, 'safe'));
  for (const html of ['   \n', '\0<html>', '\u0001<html>'])
    assert.throws(() => audit(html));
  for (const appId of [
    'https://private.invalid',
    '../page',
    'User Name',
    'CAPS',
    'a'.repeat(65),
    'private\u001b[31m',
  ])
    assert.throws(() => auditProvidedHtml(Buffer.from(afterHtml), appId));
  assert.throws(() =>
    auditProvidedHtml(Buffer.from(afterHtml), 'safe', new Date('bad')),
  );
  assert.equal(
    decodeUtf8(Buffer.from('\ufeff<html>ok</html>')),
    '<html>ok</html>',
  );
  assert.equal(safeText('ok\u001b[31m\u202ehide\n'), 'ok [31m hide');
});

void test('strict report validation rejects malformed, extra, missing and hostile fields', () => {
  const mutations: Array<(value: Record<string, unknown>) => void> = [
    (value) => {
      value.reportKind = 'observed_source';
    },
    (value) => {
      value.sourceScope = 'source-only';
    },
    (value) => {
      value.runtime = 'verified';
    },
    (value) => {
      value.sourceBytes = Infinity;
    },
    (value) => {
      value.sourceBytes = -1;
    },
    (value) => {
      value.sourceBytes = 1.5;
    },
    (value) => {
      value.analyzedAt = '2026-02-30T12:00:00.000Z';
    },
    (value) => {
      value.analyzedAt = '2026-09-05';
    },
    (value) => {
      value.modelVersion = 'another-model';
    },
    (value) => {
      value.analysisLimitBytes = 100;
    },
    (value) => {
      value.sourceSha256 = 'not-a-sha';
    },
    (value) => {
      value.goal = 'secret';
    },
    (value) => {
      delete value.acquisition;
    },
    (value) => {
      value.excludedChecks = [];
    },
    (value) => {
      value.limitations = [];
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(audit()) as unknown as Record<
      string,
      unknown
    >;
    mutate(changed);
    assert.throws(() => validateLocalReport(changed));
  }
  for (const bad of [null, [], true, 'html', { __proto__: { injected: true } }])
    assert.throws(() => validateLocalReport(bad));
});

void test('fixed complete inventory refuses omitted, duplicate, unknown and transport rules', () => {
  for (const kind of [
    'missing',
    'duplicate',
    'unknown',
    'transport',
    'control',
    'runtime',
    'extra',
    'arbitrary-title',
    'arbitrary-advice',
  ]) {
    const changed = audit();
    if (kind === 'missing') changed.findings.pop();
    if (kind === 'duplicate') changed.findings[1] = { ...changed.findings[0] };
    if (kind === 'unknown') changed.findings[1].ruleId = '__proto__';
    if (kind === 'transport') changed.findings[1].ruleId = 'TRANSPORT_HTTPS';
    if (kind === 'control') changed.findings[1].recommendation = 'bad\u001b[2J';
    if (kind === 'runtime') changed.findings[0].status = 'pass';
    if (kind === 'extra')
      Object.assign(changed.findings[1], { source: 'private HTML' });
    if (kind === 'arbitrary-title')
      changed.findings[1].title = '<p>PRIVATE_SOURCE</p>';
    if (kind === 'arbitrary-advice')
      changed.findings[1].recommendation = 'C:\\private\\file.html';
    assert.throws(() => validateLocalReport(changed), kind);
  }
});

void test('comparison rejects wrong app/page, chronology, imported or incomplete reports', () => {
  const baseline = audit();
  assert.throws(() =>
    compareLocalReports(baseline, { ...baseline, appId: 'another-page' }),
  );
  assert.throws(() =>
    compareLocalReports(baseline, {
      ...baseline,
      analyzedAt: '2026-09-04T12:00:00.000Z',
    }),
  );
  assert.throws(() =>
    compareLocalReports(baseline, {
      ...baseline,
      acquisition: 'imported-contract',
    }),
  );
  assert.throws(() =>
    compareLocalReports(baseline, {
      ...baseline,
      findingsCoverage: { status: 'partial', total: 4, returned: 4 },
    }),
  );
});

void test('JSON parser rejects duplicate decoded keys, invalid syntax, excessive depth and prototype fields', () => {
  for (const json of [
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":2}',
    '{"a":{"x":1,"x":2}}',
    '{broken',
    '['.repeat(17) + '0' + ']'.repeat(17),
  ])
    assert.throws(() => parseReportJson(Buffer.from(json)));
  const malicious = JSON.stringify(audit()).replace(
    '{',
    '{"__proto__":{"polluted":true},',
  );
  assert.throws(() =>
    validateLocalReport(parseReportJson(Buffer.from(malicious))),
  );
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
  assert.deepEqual(
    validateLocalReport(parseReportJson(Buffer.from(JSON.stringify(audit())))),
    audit(),
  );
});
