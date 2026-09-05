import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { analyzeSource } from '../../lib/scanner';
import type { AnalyzeInput } from '../../lib/scanner';
import type { ScanReport } from '../../lib/types';
import { cases, protocolVersion } from './consistency-cases';
import type { PilotCase } from './consistency-cases';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = resolve(root, 'docs/research/automated-consistency/results');
const fixedTime = new Date('2026-09-05T00:00:00.000Z');
export const sha256 = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');

export function assess(html: string, options: PilotCase['afterOptions'] = {}) {
  const bytes = Buffer.byteLength(html, 'utf8');
  const input: AnalyzeInput = {
    normalizedUrl: 'https://fixture.invalid/',
    finalUrl: 'https://fixture.invalid/',
    html,
    status: 200,
    contentType: 'text/html; charset=utf-8',
    bytesRead: bytes,
    declaredBytes: bytes + (options.truncated ? 100 : 0),
    analysisLimitBytes: bytes,
    truncated: false,
    redirects: options.normalizedUrl ? 1 : 0,
    now: fixedTime,
    ...options,
  };
  return analyzeSource(input);
}

export function project(report: ScanReport) {
  return {
    value: report.baselineActionability.value,
    coverage: report.baselineActionability.coverage,
    confidence: report.baselineActionability.confidence,
    interval: report.baselineActionability.interval,
    modelVersion: report.baselineActionability.modelVersion,
    categories: report.baselineActionability.categories.map((category) => ({
      id: category.id,
      score: category.score,
      weight: category.weight,
      metrics: category.metrics?.map(({ id, observed, points, possible }) => ({
        id,
        observed,
        points,
        possible,
      })),
    })),
    counts: report.counts,
    actions: report.actionSurface
      .map(
        ({
          id,
          humanUiAvailable,
          agentUiConfidence,
          risk,
          webmcpStatus,
          sourceEvidenceIds,
        }) => ({
          id,
          humanUiAvailable,
          agentUiConfidence,
          risk,
          webmcpStatus,
          sourceEvidenceIds,
        }),
      )
      .sort((a, b) => a.id.localeCompare(b.id, 'en')),
    implementationState: report.implementationState,
    webmcpQuality: report.webmcpQuality,
    webmcpLift: report.webmcpLift,
    findings: report.findings
      .map(({ ruleId, status, severity }) => ({ ruleId, status, severity }))
      .sort((a, b) => a.ruleId.localeCompare(b.ruleId, 'en')),
    truncated: report.response.truncated,
  };
}

function metric(report: ScanReport, id: string) {
  const result = report.baselineActionability.categories
    .flatMap((c) => c.metrics ?? [])
    .find((m) => m.id === id);
  if (!result) throw new Error(`Missing expected metric: ${id}`);
  return result.points;
}

function scoreAndActions(report: ScanReport) {
  const { value, coverage, categories, actions, modelVersion } =
    project(report);
  return { value, coverage, categories, actions, modelVersion };
}

export function evaluate(
  test: PilotCase,
  before: ScanReport,
  after: ScanReport,
) {
  const checks: Array<{
    check: string;
    passed: boolean;
    before: unknown;
    after: unknown;
  }> = [];
  const check = (label: string, a: unknown, b: unknown, predicate: boolean) =>
    checks.push({ check: label, passed: predicate, before: a, after: b });
  const same = (label: string, a: unknown, b: unknown) =>
    check(label, a, b, isDeepStrictEqual(a, b));
  const direction = (id: string, increase: boolean) => {
    const a = metric(before, id);
    const b = metric(after, id);
    check(
      `${id} ${increase ? 'increases' : 'decreases'}`,
      a,
      b,
      increase ? b > a : b < a,
    );
  };
  switch (test.relation) {
    case 'same-assessment':
      same('normalized assessment unchanged', project(before), project(after));
      break;
    case 'same-score-and-actions':
      same(
        'scores and semantic actions unchanged; raw counts may differ',
        scoreAndActions(before),
        scoreAndActions(after),
      );
      break;
    case 'field-name-decrease':
      direction('field-names', false);
      break;
    case 'field-name-increase':
      direction('field-names', true);
      break;
    case 'feedback-increase':
      direction('live-feedback', true);
      break;
    case 'transport-decrease':
      direction('secure-transport', false);
      break;
    case 'hint-only':
      same(
        'source UI score unchanged',
        scoreAndActions(before),
        scoreAndActions(after),
      );
      check(
        'source hint detected',
        before.implementationState,
        after.implementationState,
        after.implementationState === 'source_hint_detected',
      );
      same('runtime quality remains unknown', null, after.webmcpQuality);
      same('runtime lift remains unknown', null, after.webmcpLift);
      break;
    case 'truncated-uncertainty':
      same(
        'captured-prefix score unchanged',
        before.baselineActionability.value,
        after.baselineActionability.value,
      );
      same(
        'complete-page interval is maximally uncertain',
        { lower: 0, upper: 100 },
        after.baselineActionability.interval,
      );
      same('confidence lowered', 'low', after.baselineActionability.confidence);
      same('truncation represented', true, after.response.truncated);
      break;
    case 'goal-not-source':
      same(
        'goal does not change source score',
        before.baselineActionability,
        after.baselineActionability,
      );
      check(
        'requested action explicitly inferred without UI',
        null,
        after.actionSurface.find((a) => a.id === 'action-delete'),
        after.actionSurface.some(
          (a) =>
            a.id === 'action-delete' &&
            !a.humanUiAvailable &&
            a.sourceEvidenceIds.includes('ev-goal'),
        ),
      );
      break;
  }
  return { passed: checks.every((item) => item.passed), checks };
}

export function collect() {
  const files = [
    'lib/scanner.ts',
    'lib/scoring.ts',
    'lib/demo.ts',
    'lib/types.ts',
    'package-lock.json',
    'scripts/research/consistency-cases.ts',
    'scripts/research/run-consistency-pilot.ts',
    'docs/research/automated-consistency/protocol.md',
  ];
  const hashes = () =>
    Object.fromEntries(
      files.map((file) => [file, sha256(readFileSync(resolve(root, file)))]),
    );
  const sourceHashes = hashes();
  const rows = cases.map((test) => {
    const before = assess(test.before);
    const after = assess(test.after, test.afterOptions);
    const { passed, checks } = evaluate(test, before, after);
    return {
      id: test.id,
      family: test.family,
      relation: test.relation,
      assumption: test.assumption,
      beforeFixture: { html: test.before, sha256: sha256(test.before) },
      afterFixture: {
        html: test.after,
        sha256: sha256(test.after),
        options: test.afterOptions ?? {},
      },
      outcome: passed ? 'pass' : 'fail',
      checks,
      before: project(before),
      after: project(after),
    };
  });
  if (!isDeepStrictEqual(sourceHashes, hashes()))
    throw new Error(
      'Source changed during collection; discard run and retry explicitly.',
    );
  const families = [...new Set(rows.map((r) => r.family))].map((family) => ({
    family,
    passed: rows.filter((r) => r.family === family && r.outcome === 'pass')
      .length,
    failed: rows.filter((r) => r.family === family && r.outcome === 'fail')
      .length,
    total: rows.filter((r) => r.family === family).length,
  }));
  return {
    schemaVersion: '1.0.0',
    protocolVersion,
    dataset: 'owned-synthetic-html-consistency-pilot',
    collectionMode: 'local-function-only-no-network-no-model',
    analyzerTimestamp: fixedTime.toISOString(),
    sourceHashes,
    fixturePairCount: rows.length,
    failed: rows.filter((r) => r.outcome === 'fail').length,
    passed: rows.filter((r) => r.outcome === 'pass').length,
    families,
    rows,
  };
}

export function resolveOutput(value: string) {
  const output = resolve(root, value);
  const within = relative(outputRoot, output);
  if (
    !within ||
    within.startsWith('..') ||
    isAbsolute(within) ||
    !output.endsWith('.json')
  ) {
    throw new Error(
      'Output must be a JSON file beneath docs/research/automated-consistency/results.',
    );
  }
  return output;
}

function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const output = resolveOutput(
    outputIndex >= 0
      ? (args[outputIndex + 1] ?? '')
      : 'docs/research/automated-consistency/results/baseline.json',
  );
  const artifact = collect();
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  if (existsSync(output)) {
    if (!isDeepStrictEqual(JSON.parse(readFileSync(output, 'utf8')), artifact))
      throw new Error(
        'Existing artifact differs; preserve it and choose a new output filename.',
      );
  } else if (args.includes('--check')) {
    throw new Error('Artifact does not exist for read-only verification.');
  } else {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, serialized, { flag: 'wx' });
    const manifest = {
      executedAt: new Date().toISOString(),
      node: process.version,
      gitBase: execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      note: 'Git base is provenance only; source hashes identify analyzed working-tree files.',
      artifactSha256: sha256(serialized),
    };
    writeFileSync(
      output.replace(/\.json$/, '.run.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { flag: 'wx' },
    );
    const report = [
      '# Automated consistency pilot: observed results',
      '',
      `Protocol: ${protocolVersion}. ${artifact.passed} passed, ${artifact.failed} failed across ${artifact.fixturePairCount} purposively authored pairs.`,
      '',
      'These counts describe only this internal synthetic suite, not a population error rate or agent-performance result.',
      '',
      '| Family | Passed | Failed | Total |',
      '| --- | ---: | ---: | ---: |',
      ...artifact.families.map(
        (f) => `| ${f.family} | ${f.passed} | ${f.failed} | ${f.total} |`,
      ),
      '',
      '| Case | Relation | Result |',
      '| --- | --- | --- |',
      ...artifact.rows.map((r) => `| ${r.id} | ${r.relation} | ${r.outcome} |`),
      '',
      'All before/after inputs, hashes, projections, and check outcomes are retained in the neighboring JSON artifact. Failures were not removed or reclassified.',
      '',
      'Do not overwrite this result after a scanner fix. Run a new named artifact and describe the change separately.',
      '',
    ].join('\n');
    writeFileSync(output.replace(/\.json$/, '.md'), report, { flag: 'wx' });
  }
  console.log(
    JSON.stringify({
      cases: artifact.fixturePairCount,
      passed: artifact.passed,
      failed: artifact.failed,
      failures: artifact.rows
        .filter((r) => r.outcome === 'fail')
        .map((r) => r.id),
      artifact: relative(root, output),
      checked: args.includes('--check'),
    }),
  );
  if (args.includes('--strict') && artifact.failed) process.exitCode = 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
