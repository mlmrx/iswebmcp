/** Replay recorded observations without changing the checkout or stored artifacts. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cases } from './consistency-cases';
import {
  evaluate,
  project,
  resolveOutput,
  sha256,
} from './run-consistency-pilot';
import type { analyzeSource } from '../../lib/scanner';
import { recoverRecordedBytes } from './provenance';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const artifactPath = resolveOutput(
  process.argv[2] ??
    'docs/research/automated-consistency/results/baseline.json',
);
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
const manifest = JSON.parse(
  readFileSync(artifactPath.replace(/\.json$/, '.run.json'), 'utf8'),
);
assert.equal(
  sha256(`${JSON.stringify(artifact, null, 2)}\n`),
  manifest.artifactSha256,
  'Artifact serialization checksum differs',
);
assert.match(
  manifest.gitBase,
  /^[a-f0-9]{40}$/,
  'Manifest must identify an exact Git base',
);

let scannerBytes: Buffer | undefined;
for (const [file, hash] of Object.entries(artifact.sourceHashes)) {
  // The fixed allowlist prevents a modified artifact from selecting arbitrary paths.
  assert.ok(
    [
      'lib/scanner.ts',
      'lib/scoring.ts',
      'lib/demo.ts',
      'lib/types.ts',
      'package-lock.json',
      'scripts/research/consistency-cases.ts',
      'scripts/research/run-consistency-pilot.ts',
      'docs/research/automated-consistency/protocol.md',
    ].includes(file),
    `Unexpected source path: ${file}`,
  );
  assert.equal(typeof hash, 'string');
  let bytes = recoverRecordedBytes(
    readFileSync(resolve(root, file)),
    hash as string,
  );
  if (!bytes && file === 'lib/scanner.ts') {
    bytes = recoverRecordedBytes(
      execFileSync('git', ['show', `${manifest.gitBase}:${file}`], {
        cwd: root,
      }),
      hash as string,
    );
  }
  assert.ok(
    bytes,
    `Recorded source bytes unavailable for ${file}; use the release containing the recorded artifact or recover matching content before replay`,
  );
  if (file === 'lib/scanner.ts') scannerBytes = bytes;
}
assert.ok(scannerBytes, 'Missing scanner source');
const temp = mkdtempSync(join(tmpdir(), 'iswebmcp-pilot-replay-'));
const modulePath = join(temp, 'scanner.ts');
try {
  writeFileSync(modulePath, scannerBytes, { flag: 'wx' });
  const scanner = (await import(pathToFileURL(modulePath).href)) as {
    analyzeSource: typeof analyzeSource;
  };
  assert.equal(artifact.rows.length, cases.length);
  let verified = 0;
  for (const definition of cases) {
    const row = artifact.rows.find(
      (item: { id: string }) => item.id === definition.id,
    );
    assert.ok(row, `Missing recorded case ${definition.id}`);
    assert.equal(row.beforeFixture.sha256, sha256(definition.before));
    assert.equal(row.afterFixture.sha256, sha256(definition.after));
    const run = (html: string, options = definition.afterOptions ?? {}) =>
      scanner.analyzeSource({
        normalizedUrl: 'https://fixture.invalid/',
        finalUrl: 'https://fixture.invalid/',
        html,
        status: 200,
        contentType: 'text/html; charset=utf-8',
        bytesRead: Buffer.byteLength(html, 'utf8'),
        declaredBytes:
          Buffer.byteLength(html, 'utf8') + (options.truncated ? 100 : 0),
        analysisLimitBytes: Buffer.byteLength(html, 'utf8'),
        truncated: false,
        redirects: options.normalizedUrl ? 1 : 0,
        now: new Date(artifact.analyzerTimestamp),
        ...options,
      });
    const before = run(definition.before, {});
    const after = run(definition.after);
    const outcome = evaluate(definition, before, after);
    assert.deepEqual(
      project(before),
      row.before,
      `${definition.id} before differs`,
    );
    assert.deepEqual(
      project(after),
      row.after,
      `${definition.id} after differs`,
    );
    assert.deepEqual(
      outcome.checks,
      row.checks,
      `${definition.id} checks differ`,
    );
    assert.equal(outcome.passed ? 'pass' : 'fail', row.outcome);
    verified++;
  }
  console.log(
    JSON.stringify({
      verified,
      recordedPasses: artifact.passed,
      recordedFailures: artifact.failed,
      artifactPath,
    }),
  );
} finally {
  unlinkSync(modulePath);
  rmdirSync(temp);
}
