import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { main } from '../bin/iswebmcp.mjs';

const fixture = (findings = []) => ({
  summarySchemaVersion: 'iswebmcp-summary/v2',
  comparisonContext: {
    version: 'source-input/v1',
    fingerprint: `sha256:${'a'.repeat(64)}`,
  },
  findingsCoverage: {
    status: 'complete',
    total: findings.length,
    returned: findings.length,
  },
  reportId: 'cli-test',
  reportKind: 'observed_source',
  url: 'https://example.com/',
  scannedAt: '2026-09-05T12:00:00Z',
  evidenceScope: 'source-only',
  implementationState: 'not_detected',
  collection: {
    status: 'complete',
    truncated: false,
    analyzedBytes: 100,
    declaredBytes: null,
  },
  actionability: {
    value: 0,
    coverage: 100,
    modelVersion: 'test-v1',
    confidence: 'low',
    interval: null,
  },
  counts: {},
  actions: [],
  recommendations: [],
  findings: findings.map((finding) => ({ ruleId: finding.title, ...finding })),
  limitations: ['Source only'],
  labels: { runtime: 'unknown', lift: 'withheld', contract: 'not-provided' },
});
function io(scanFn) {
  const output = { out: '', err: '' };
  return {
    output,
    stdout: {
      write: (value) => {
        output.out += value;
      },
    },
    stderr: {
      write: (value) => {
        output.err += value;
      },
    },
    scanFn,
  };
}
async function temporary(t) {
  const folder = await mkdtemp(join(tmpdir(), 'iswebmcp-kit-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  return folder;
}

test('help and invalid arguments perform no scans', async () => {
  for (const args of [
    ['--help'],
    ['scan'],
    ['scan', 'https://example.com', '--typo'],
    ['compare', 'one'],
    ['scan', 'https://example.com', '--output'],
    ['scan', 'https://example.com', '--json', '--json'],
  ]) {
    const streams = io(() => assert.fail('must not fetch'));
    assert.equal(await main(args, streams), args[0] === '--help' ? 0 : 2);
  }
});

test('scan writes parseable raw summary and forwards explicit options', async (t) => {
  const folder = await temporary(t);
  const output = join(folder, 'nested', 'current.json');
  const streams = io(async (url, options) => {
    assert.equal(url, 'https://example.com');
    assert.deepEqual(options, {
      goal: 'Find products',
      includeQuery: true,
      timeoutMs: 1000,
    });
    return fixture();
  });
  assert.equal(
    await main(
      [
        'scan',
        'https://example.com',
        '--goal',
        'Find products',
        '--include-query',
        '--timeout',
        '1000',
        '--output',
        output,
        '--json',
      ],
      streams,
    ),
    0,
  );
  assert.deepEqual(JSON.parse(streams.output.out), fixture());
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), fixture());
});

test('existing output is preserved', async (t) => {
  const path = join(await temporary(t), 'baseline.json');
  await writeFile(path, 'keep this');
  const streams = io(async () => fixture());
  assert.equal(
    await main(['scan', 'https://example.com', '--output', path], streams),
    2,
  );
  assert.equal(await readFile(path, 'utf8'), 'keep this');
  assert.match(streams.output.err, /OUTPUT_EXISTS/);
});

test('partial scan preserves evidence but exits as unavailable for gating', async (t) => {
  const value = fixture();
  value.collection = {
    ...value.collection,
    status: 'partial',
    truncated: true,
  };
  const path = join(await temporary(t), 'partial.json');
  const streams = io(async () => value);
  assert.equal(
    await main(['scan', 'https://example.com', '--output', path], streams),
    2,
  );
  assert.equal(
    JSON.parse(await readFile(path, 'utf8')).collection.status,
    'partial',
  );
  assert.match(streams.output.err, /PARTIAL_COLLECTION/);
});

test('comparison uses exit 1 only for a comparable reported regression and saves diff', async (t) => {
  const folder = await temporary(t);
  const baseline = join(folder, 'baseline.json');
  const current = join(folder, 'current.json');
  const output = join(folder, 'diff.json');
  await writeFile(baseline, JSON.stringify(fixture()));
  await writeFile(
    current,
    JSON.stringify(
      fixture([
        {
          title: 'Labels',
          status: 'fail',
          severity: 'high',
          recommendation: 'Fix labels.',
        },
      ]),
    ),
  );
  const streams = io();
  assert.equal(
    await main(
      ['compare', baseline, current, '--json', '--output', output],
      streams,
    ),
    1,
  );
  assert.equal(JSON.parse(streams.output.out).regressionCount, 1);
  assert.equal(JSON.parse(await readFile(output, 'utf8')).regressed, true);
  assert.equal(await main(['compare', baseline, baseline], io()), 0);
});

test('malformed files and missing model version fail rather than green-lighting CI', async (t) => {
  const folder = await temporary(t);
  const path = join(folder, 'report.json');
  await writeFile(path, 'not JSON');
  assert.equal(await main(['compare', path, path], io()), 2);
  const value = fixture();
  delete value.actionability.modelVersion;
  await writeFile(path, JSON.stringify(value));
  const streams = io();
  assert.equal(await main(['compare', path, path], streams), 2);
  assert.match(streams.output.err, /NOT_COMPARABLE/);
});

test('human output strips terminal controls from target-derived findings', async () => {
  const streams = io(async () =>
    fixture([
      {
        title: '\u001b[31mLabels',
        status: 'fail',
        severity: 'high',
        recommendation: 'Fix\u0007',
      },
    ]),
  );
  assert.equal(await main(['scan', 'https://example.com'], streams), 0);
  assert.equal(streams.output.out.includes('\u001b'), false);
  assert.equal(streams.output.out.includes('\u0007'), false);
});

test('legacy or different-input comparisons exit 2 with actionable explanation', async (t) => {
  const folder = await temporary(t);
  const baseline = join(folder, 'baseline.json');
  const current = join(folder, 'current.json');
  await writeFile(baseline, JSON.stringify(fixture()));
  for (const changed of [
    { ...fixture(), summarySchemaVersion: 'iswebmcp-summary/v1' },
    {
      ...fixture(),
      comparisonContext: {
        version: 'source-input/v1',
        fingerprint: `sha256:${'b'.repeat(64)}`,
      },
    },
    {
      ...fixture(),
      findingsCoverage: { status: 'partial', total: 3, returned: 0 },
    },
  ]) {
    await writeFile(current, JSON.stringify(changed));
    const streams = io();
    assert.equal(await main(['compare', baseline, current], streams), 2);
    assert.match(streams.output.err, /NOT_COMPARABLE/);
    assert.equal(streams.output.out, '');
  }
});
