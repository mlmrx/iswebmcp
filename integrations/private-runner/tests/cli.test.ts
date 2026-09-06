import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { auditProvidedHtml } from '../src/core';

let directory: string;
let bundle: string;
const fixture =
  '<form><label for="q">Search</label><input id="q"><button>Search</button></form>';
const networkTrap = fileURLToPath(
  new URL('./deny-network.cjs', import.meta.url),
);
const execute = (args: string[]) =>
  spawnSync(process.execPath, ['--require', networkTrap, bundle, ...args], {
    encoding: 'utf8',
    timeout: 12_000,
    maxBuffer: 256_000,
    windowsHide: true,
  });

before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'iswebmcp-private-cli-'));
  bundle = path.join(directory, 'iswebmcp-offline.mjs');
  // Exercise the exact standalone ESM runtime, including its self-hosted worker.
  await build({
    entryPoints: [fileURLToPath(new URL('../src/cli.ts', import.meta.url))],
    outfile: bundle,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    tsconfig: fileURLToPath(new URL('../../../tsconfig.json', import.meta.url)),
  });
});

after(async () => {
  if (!directory) return;
  const tempRoot = await fs.realpath(os.tmpdir());
  const target = await fs.realpath(directory);
  assert.equal(path.dirname(target).toLowerCase(), tempRoot.toLowerCase());
  assert.ok(path.basename(target).startsWith('iswebmcp-private-cli-'));
  assert.notEqual(target.toLowerCase(), tempRoot.toLowerCase());
  await fs.rm(target, { recursive: true, force: true });
});

void test('bundled help/audit/compare work with outbound network functions trapped in main and worker', async () => {
  const help = execute(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /developer preview/);
  assert.match(help.stdout, /iswebmcp-offline\.mjs/);
  const input = path.join(directory, 'owned.html');
  const baselinePath = path.join(directory, 'baseline.json');
  const currentPath = path.join(directory, 'current.json');
  await fs.writeFile(input, fixture);
  assert.equal(
    execute([
      'audit',
      input,
      '--app',
      'catalog-search',
      '--output',
      baselinePath,
    ]).status,
    0,
  );
  await fs.writeFile(
    input,
    '<form><input id="q"><button>Search</button></form>',
  );
  const audited = execute([
    'audit',
    input,
    '--output',
    currentPath,
    '--app',
    'catalog-search',
  ]);
  assert.equal(audited.status, 0, audited.stderr);
  const comparisonPath = path.join(directory, 'comparison.json');
  const comparison = execute([
    'compare',
    baselinePath,
    currentPath,
    '--output',
    comparisonPath,
  ]);
  assert.equal(comparison.status, 1, comparison.stderr);
  const report = JSON.parse(await fs.readFile(comparisonPath, 'utf8'));
  assert.equal(report.regressionCount, 1);
  assert.equal(report.runtime, 'unknown');
  const unchanged = execute([
    'compare',
    currentPath,
    currentPath,
    '--output',
    path.join(directory, 'unchanged.json'),
  ]);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  assert.match(unchanged.stdout, /1 current partial\/failing/);
});

void test('bundled reports and terminal output do not disclose source content or filesystem paths', async () => {
  const secret = 'PRIVATE_SECRET_FROM_SOURCE_4815';
  const input = path.join(directory, `${secret}.html`);
  const output = path.join(directory, `${secret}.json`);
  await fs.writeFile(
    input,
    `<title>${secret}</title><form action="https://${secret}.invalid/"><input value="${secret}" placeholder="${secret}"><button>${secret}</button></form><script>fetch('https://${secret}.invalid')</script>`,
  );
  const result = execute([
    'audit',
    input,
    '--app',
    'page-one',
    '--output',
    output,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const content = await fs.readFile(output, 'utf8');
  for (const text of [result.stdout, result.stderr, content]) {
    assert.ok(!text.includes(secret));
    assert.ok(!text.includes(directory));
    assert.ok(!text.includes('https://'));
  }
  const repeated = execute([
    'audit',
    input,
    '--app',
    'page-one',
    '--output',
    output,
  ]);
  assert.equal(repeated.status, 2);
  assert.match(repeated.stderr, /OUTPUT_EXISTS/);
  assert.ok(!repeated.stderr.includes(secret));
  assert.equal(await fs.readFile(output, 'utf8'), content);
});

void test('invalid UTF-8, malformed report text, incompatible IDs and usage errors create no output', async () => {
  const input = path.join(directory, 'invalid-utf8.html');
  const target = path.join(directory, 'invalid-output.json');
  await fs.writeFile(input, Buffer.from([0xc3, 0x28]));
  let result = execute(['audit', input, '--app', 'safe', '--output', target]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /INVALID_UTF8/);
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });

  const baseline = auditProvidedHtml(Buffer.from(fixture), 'page-one');
  const malicious = structuredClone(baseline);
  malicious.findings[1].recommendation = '<html>PRIVATE_SECRET_IN_JSON</html>';
  const baselinePath = path.join(directory, 'valid-input.json');
  const currentPath = path.join(directory, 'malicious-input.json');
  await fs.writeFile(baselinePath, JSON.stringify(baseline));
  await fs.writeFile(currentPath, JSON.stringify(malicious));
  result = execute(['compare', baselinePath, currentPath, '--output', target]);
  assert.equal(result.status, 2);
  assert.ok(!result.stderr.includes('PRIVATE_SECRET_IN_JSON'));
  await fs.writeFile(
    currentPath,
    JSON.stringify({ ...baseline, appId: 'page-two' }),
  );
  assert.equal(
    execute(['compare', baselinePath, currentPath, '--output', target]).status,
    2,
  );
  for (const args of [
    [],
    ['--help', '--extra'],
    ['audit', input, '--app', 'safe'],
    ['audit', input, '--app', 'safe', '--app', 'another'],
    ['compare', baselinePath, currentPath, '--output', target, '--extra', 'x'],
  ]) {
    assert.equal(execute(args).status, 2);
  }
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
});

void test('hostile repeated references are terminated at the analysis deadline without a report', async () => {
  const input = path.join(directory, 'repeated-references.html');
  const output = path.join(directory, 'timeout-output.json');
  await fs.writeFile(
    input,
    '<html><body>' +
      '<input aria-labelledby="missing">'.repeat(50_000) +
      '</body></html>',
  );
  const start = Date.now();
  const result = execute([
    'audit',
    input,
    '--app',
    'stress-fixture',
    '--output',
    output,
  ]);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ANALYSIS_LIMIT/);
  assert.ok(
    Date.now() - start < 11_000,
    'The child must exit after terminating the blocked worker.',
  );
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

void test('extracted demo works repeatedly from another directory with network calls trapped', async () => {
  const exampleSource = fileURLToPath(new URL('../examples/', import.meta.url));
  const exampleDestination = path.join(directory, 'examples');
  await fs.mkdir(exampleDestination);
  for (const name of ['before.html', 'after.html', 'run-demo.mjs']) {
    await fs.copyFile(
      path.join(exampleSource, name),
      path.join(exampleDestination, name),
    );
  }
  const previousDirectories = new Set(await fs.readdir(directory));
  const outputs: string[] = [];
  for (let count = 0; count < 2; count += 1) {
    const result = spawnSync(
      process.execPath,
      [path.join(exampleDestination, 'run-demo.mjs')],
      {
        cwd: os.tmpdir(),
        shell: false,
        windowsHide: true,
        encoding: 'utf8',
        timeout: 15_000,
        env: {
          ...process.env,
          NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(networkTrap)}`,
        },
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /Fix comparison: exit 0; 0 new or worsened findings/,
    );
    assert.match(
      result.stdout,
      /Removing the label again: exit 1; 1 new problem/,
    );
    assert.match(result.stdout, /Runtime remains unknown/);
    assert.ok(!result.stdout.includes(directory));
    outputs.push(result.stdout);
  }
  const resultDirectories = (await fs.readdir(directory)).filter(
    (name) =>
      name.startsWith('demo-results-') && !previousDirectories.has(name),
  );
  assert.equal(resultDirectories.length, 2);
  assert.notEqual(outputs[0], outputs[1]);
  for (const name of resultDirectories) {
    const outputRoot = path.join(directory, name);
    assert.equal((await fs.readdir(outputRoot)).length, 5);
    const fix = JSON.parse(
      await fs.readFile(path.join(outputRoot, 'fix-comparison.json'), 'utf8'),
    );
    const regression = JSON.parse(
      await fs.readFile(
        path.join(outputRoot, 'regression-comparison.json'),
        'utf8',
      ),
    );
    assert.equal(fix.regressionCount, 0);
    assert.equal(regression.regressionCount, 1);
  }
});
