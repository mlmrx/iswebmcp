import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactDirectory = resolve(root, 'artifacts/private-runner');
const sourcePackage = JSON.parse(
  await readFile(
    resolve(root, 'integrations/private-runner/package.json'),
    'utf8',
  ),
);
const archiveName = `iswebmcp-private-runner-${sourcePackage.version}.zip`;
const executable = 'iswebmcp-private.mjs';
const lexical = (left, right) => String(left).localeCompare(String(right));
const sourcePaths = [
  'integrations/private-runner/src/cli.ts',
  'integrations/private-runner/src/analysis.ts',
  'integrations/private-runner/src/core.ts',
  'integrations/private-runner/src/files.ts',
  'lib/scanner.ts',
  'lib/scoring.ts',
  'lib/demo.ts',
  'lib/types.ts',
];
const expectedFiles = [
  executable,
  'README.md',
  'LICENSE',
  'package.json',
  'build-provenance.json',
  ...sourcePaths.map((path) => `source/${path}`),
].sort(lexical);
const allowedBuiltins = new Set([
  'node:crypto',
  'node:fs',
  'node:fs/promises',
  'node:path',
  'node:url',
  'node:util',
  'node:worker_threads',
]);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceSecret = 'PRIVATE_SOURCE_SENTINEL_937a';
const pathSecret = 'PRIVATE_PATH_SENTINEL_aa21';
const environmentSecret = 'PRIVATE_ENV_SENTINEL_f812';
const executionSentinel = 'INLINE_SCRIPT_EXECUTED_418b';
const networkSentinel = 'NETWORK_ATTEMPT_FORBIDDEN_523c';

// The runner must not use any network API, including from its worker. The
// preload is inherited by worker threads and makes accidental requests fail.
const networkGuard = `
import http from 'node:http';
import https from 'node:https';
import http2 from 'node:http2';
import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';
import dns from 'node:dns';
import dnsPromises from 'node:dns/promises';
import { syncBuiltinESMExports } from 'node:module';
const denied = () => { throw new Error('${networkSentinel}'); };
for (const module of [http, https]) {
  module.request = denied;
  module.get = denied;
}
http2.connect = denied;
net.connect = denied;
net.createConnection = denied;
net.Socket.prototype.connect = denied;
tls.connect = denied;
dgram.createSocket = denied;
for (const module of [dns, dnsPromises]) {
  for (const key of Object.keys(module)) {
    if (/^(lookup|resolve|reverse)/.test(key)) module[key] = denied;
  }
}
globalThis.fetch = denied;
globalThis.WebSocket = class { constructor() { denied(); } };
syncBuiltinESMExports();
`;
const guardUrl = `data:text/javascript,${encodeURIComponent(networkGuard)}`;

let sandbox;
let archive;
let manifest;
let files;
let provenance;

function confinedPath(name) {
  assert.ok(sandbox, 'The verified extraction directory must exist.');
  assert.ok(name && !isAbsolute(name));
  assert.ok(!name.includes('\\') && !name.split('/').includes('..'));
  const target = resolve(sandbox, name);
  const suffix = relative(sandbox, target);
  assert.ok(suffix && !suffix.startsWith('..') && !isAbsolute(suffix));
  return target;
}

function run(args, timeout = 15_000) {
  const result = spawnSync(
    process.execPath,
    ['--no-warnings', '--import', guardUrl, confinedPath(executable), ...args],
    {
      cwd: sandbox,
      encoding: 'utf8',
      timeout,
      maxBuffer: 256 * 1024,
      // Do not inherit credentials, custom loaders, or dependency search paths.
      env: {
        ...(process.env.SystemRoot
          ? { SystemRoot: process.env.SystemRoot }
          : {}),
        ...(process.env.WINDIR ? { WINDIR: process.env.WINDIR } : {}),
        TEMP: sandbox,
        TMP: sandbox,
        NODE_PATH: '',
        NODE_OPTIONS: '',
        PRIVATE_RUNNER_TEST_SECRET: environmentSecret,
      },
    },
  );
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null, `Unexpected termination: ${result.signal}`);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(networkSentinel));
  for (const secret of [
    sourceSecret,
    pathSecret,
    environmentSecret,
    executionSentinel,
  ]) {
    assert.ok(!`${result.stdout}${result.stderr}`.includes(secret));
  }
  return result;
}

async function put(name, contents) {
  const path = confinedPath(name);
  await writeFile(path, contents, { flag: 'wx', mode: 0o600 });
  return path;
}

async function json(name) {
  const contents = await readFile(confinedPath(name), 'utf8');
  for (const secret of [
    sourceSecret,
    pathSecret,
    environmentSecret,
    executionSentinel,
  ]) {
    assert.ok(
      !contents.includes(secret),
      'Reports must not echo supplied source or path text.',
    );
  }
  assert.ok(!contents.includes('<form') && !contents.includes('<script'));
  assert.ok(!contents.includes('https://'));
  return JSON.parse(contents);
}

async function absent(name) {
  await assert.rejects(lstat(confinedPath(name)), { code: 'ENOENT' });
}

const beforeHtml = `<!doctype html><html><head><title>${sourceSecret}</title></head><body>
<!-- exported from C:\\${pathSecret} -->
<form action="https://${sourceSecret}.invalid/search"><input id="query" name="q" value="${sourceSecret}"><button>Search</button></form>
<script>fetch('https://${sourceSecret}.invalid/execute'); throw new Error('${executionSentinel}');</script>
<img src="https://${sourceSecret}.invalid/pixel" onerror="throw new Error('${executionSentinel}')">
</body></html>`;
const afterHtml = beforeHtml.replace(
  '<input id="query"',
  '<label for="query">Search catalog</label><input id="query"',
);

before(async () => {
  [archive, manifest] = await Promise.all([
    readFile(resolve(artifactDirectory, archiveName)),
    readFile(
      resolve(
        artifactDirectory,
        archiveName.replace('.zip', '.checksums.json'),
      ),
      'utf8',
    ).then(JSON.parse),
  ]);
  files = unzipSync(archive);
  assert.deepEqual(
    Object.keys(files).sort(lexical),
    expectedFiles,
    'Extract only the explicit review-artifact allowlist.',
  );
  provenance = JSON.parse(
    Buffer.from(files['build-provenance.json']).toString('utf8'),
  );
  assert.equal(
    await realpath(artifactDirectory),
    artifactDirectory,
    'Artifact directory must not redirect through a link.',
  );
  assert.ok(!(await lstat(artifactDirectory)).isSymbolicLink());
  sandbox = await mkdtemp(resolve(artifactDirectory, 'package-smoke-'));
  assert.equal(dirname(sandbox), artifactDirectory);
  assert.ok(basename(sandbox).startsWith('package-smoke-'));
  assert.equal(await realpath(sandbox), sandbox);
  for (const [name, bytes] of Object.entries(files)) {
    const target = confinedPath(name);
    await mkdir(dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, bytes, { flag: 'wx', mode: 0o600 });
  }
  await absent('node_modules');
  await put(`${pathSecret}-before.html`, beforeHtml);
  await put(`${pathSecret}-after.html`, afterHtml);
});

after(async () => {
  if (!sandbox) return;
  // Never recursively remove an unchecked computed path or the artifact root.
  assert.equal(dirname(sandbox), artifactDirectory);
  assert.ok(basename(sandbox).startsWith('package-smoke-'));
  assert.notEqual(sandbox, artifactDirectory);
  assert.equal(await realpath(artifactDirectory), artifactDirectory);
  assert.equal(await realpath(sandbox), sandbox);
  assert.ok((await lstat(sandbox)).isDirectory());
  assert.ok(!(await lstat(sandbox)).isSymbolicLink());
  await rm(sandbox, { recursive: true, force: true });
});

test('private ZIP, every entry, and normalized source provenance match the checksum ledger', async () => {
  assert.equal(manifest.schemaVersion, 'iswebmcp-private-build/v1');
  assert.equal(manifest.distribution, 'private-review-artifact');
  assert.equal(manifest.version, sourcePackage.version);
  assert.equal(manifest.filename, archiveName);
  assert.equal(manifest.bytes, archive.byteLength);
  assert.equal(manifest.sha256, sha256(archive));
  assert.deepEqual(
    manifest.files.map((item) => item.path).sort(lexical),
    expectedFiles,
  );
  assert.equal(
    new Set(manifest.files.map((item) => item.path)).size,
    expectedFiles.length,
  );
  for (const entry of manifest.files) {
    assert.equal(entry.bytes, files[entry.path].byteLength, entry.path);
    assert.equal(entry.sha256, sha256(files[entry.path]), entry.path);
  }
  for (const [key, value] of Object.entries(provenance))
    assert.deepEqual(manifest[key], value);
  assert.equal(provenance.entry, executable);
  assert.equal(provenance.compiler.name, 'esbuild');
  assert.match(provenance.compiler.version, /^\d+\.\d+\.\d+$/);
  assert.equal(provenance.compiler.target, 'node22.13');
  assert.deepEqual(
    provenance.inputs.map((item) => item.path).sort(lexical),
    [...sourcePaths].sort(lexical),
  );
  for (const input of provenance.inputs) {
    assert.equal(input.sha256, sha256(files[`source/${input.path}`]));
    const currentSource = (
      await readFile(resolve(root, input.path), 'utf8')
    ).replace(/\r\n/g, '\n');
    assert.equal(
      input.sha256,
      sha256(currentSource),
      `Stale package source: ${input.path}`,
    );
  }
});

test('artifact contains no public distribution, secrets, dependency tree, or unreviewed runtime imports', () => {
  for (const name of Object.keys(files)) {
    assert.ok(
      !/(^|\/)(?:public|node_modules|\.git|\.env(?:\..*)?|credentials|research|enterprise|attempts)(\/|$)/i.test(
        name,
      ),
      name,
    );
    assert.ok(!name.endsWith('.map'), 'Do not package sourcemaps.');
    const text = Buffer.from(files[name]).toString('utf8');
    assert.ok(
      !text.includes(root),
      'No absolute workspace path in an artifact.',
    );
    assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text));
    for (const secret of [sourceSecret, pathSecret, environmentSecret])
      assert.ok(!text.includes(secret));
  }
  const packageInfo = JSON.parse(
    Buffer.from(files['package.json']).toString('utf8'),
  );
  assert.equal(packageInfo.private, true);
  assert.equal(packageInfo.version, sourcePackage.version);
  assert.equal(packageInfo.type, 'module');
  assert.equal(packageInfo.license, 'MIT');
  assert.equal(packageInfo.engines.node, '>=22.13.0');
  assert.equal(Object.keys(packageInfo.dependencies ?? {}).length, 0);
  assert.equal(Object.keys(packageInfo.optionalDependencies ?? {}).length, 0);
  for (const dependency of provenance.runtimeDependencies)
    assert.ok(allowedBuiltins.has(dependency), dependency);
  const code = Buffer.from(files[executable]).toString('utf8');
  const imports = [...code.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  assert.ok(imports.length > 0);
  for (const dependency of imports)
    assert.ok(allowedBuiltins.has(dependency), dependency);
  assert.ok(
    !/\bimport\s*\(|\brequire\s*\(/.test(code),
    'Standalone bundle must not dynamically resolve repository dependencies.',
  );
  assert.deepEqual(
    [...new Set(imports)].sort(lexical),
    [...provenance.runtimeDependencies].sort(lexical),
  );
});

test('extracted executable runs help and rejects invalid arguments without a dependency install', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /private reviewer build/);
  assert.match(help.stdout, /No application network calls/);
  assert.equal(help.stderr, '');
  for (const args of [
    [],
    ['--unknown'],
    ['audit'],
    ['compare'],
    ['audit', `${pathSecret}-before.html`, '--app', 'catalog-search'],
    [
      'audit',
      `${pathSecret}-before.html`,
      '--app',
      'catalog-search',
      '--output',
      'unused.json',
      '--unknown',
      'value',
    ],
  ]) {
    const result = run(args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /ERROR \[USAGE\]/);
    assert.equal(result.stdout, '');
  }
});

test('standalone real HTML audits show a label fix, then detect its regression without executing scripts', async () => {
  const baseline = run([
    'audit',
    `${pathSecret}-before.html`,
    '--app',
    'catalog-search',
    '--output',
    'baseline.json',
  ]);
  assert.equal(baseline.status, 0, baseline.stderr);
  const fixed = run([
    'audit',
    `${pathSecret}-after.html`,
    '--app',
    'catalog-search',
    '--output',
    'fixed.json',
  ]);
  assert.equal(fixed.status, 0, fixed.stderr);
  const baselineReport = await json('baseline.json');
  const fixedReport = await json('fixed.json');
  assert.equal(
    baselineReport.findings.find(
      (item) => item.ruleId === 'UI_ACCESSIBLE_NAMES',
    ).status,
    'fail',
  );
  assert.equal(
    fixedReport.findings.find((item) => item.ruleId === 'UI_ACCESSIBLE_NAMES')
      .status,
    'pass',
  );
  assert.equal(baselineReport.sourceSha256, sha256(Buffer.from(beforeHtml)));
  assert.equal(fixedReport.sourceSha256, sha256(Buffer.from(afterHtml)));
  assert.equal(fixedReport.sourceScope, 'provided-html-only');
  assert.equal(fixedReport.acquisition, 'user-supplied');
  assert.equal(fixedReport.runtime, 'unknown');
  assert.deepEqual(fixedReport.excludedChecks, ['TRANSPORT_HTTPS']);
  assert.equal(fixedReport.findingsCoverage.total, fixedReport.findings.length);
  const improvement = run([
    'compare',
    'baseline.json',
    'fixed.json',
    '--output',
    'improvement.json',
  ]);
  assert.equal(improvement.status, 0, improvement.stderr);
  const improved = await json('improvement.json');
  assert.equal(improved.regressed, false);
  assert.equal(improved.regressionCount, 0);
  assert.equal(improved.runtime, 'unknown');

  const badAgain = run([
    'audit',
    `${pathSecret}-before.html`,
    '--app',
    'catalog-search',
    '--output',
    'regressed.json',
  ]);
  assert.equal(badAgain.status, 0, badAgain.stderr);
  const regression = run([
    'compare',
    'fixed.json',
    'regressed.json',
    '--output',
    'regression.json',
  ]);
  assert.equal(regression.status, 1, regression.stderr);
  const regressed = await json('regression.json');
  assert.equal(regressed.regressed, true);
  assert.equal(regressed.regressionCount, 1);
  assert.equal(regressed.currentProblemCount, 1);
  assert.deepEqual(
    regressed.changes.find((item) => item.ruleId === 'UI_ACCESSIBLE_NAMES')
      .regressionReasons,
    ['new-problem'],
  );
});

test('different app IDs refuse comparison and existing output bytes are preserved', async () => {
  assert.equal(
    run([
      'audit',
      `${pathSecret}-after.html`,
      '--app',
      'original-page',
      '--output',
      'original-app.json',
    ]).status,
    0,
  );
  assert.equal(
    run([
      'audit',
      `${pathSecret}-after.html`,
      '--app',
      'other-page',
      '--output',
      'other-app.json',
    ]).status,
    0,
  );
  const incompatible = run([
    'compare',
    'original-app.json',
    'other-app.json',
    '--output',
    'incompatible.json',
  ]);
  assert.equal(incompatible.status, 2);
  assert.match(incompatible.stderr, /ERROR \[NOT_COMPARABLE\]/);
  await absent('incompatible.json');

  const protectedBytes = Buffer.from(
    `existing private evidence: ${sourceSecret}\n`,
  );
  await put('do-not-overwrite.json', protectedBytes);
  const refusedAudit = run([
    'audit',
    `${pathSecret}-before.html`,
    '--app',
    'original-page',
    '--output',
    'do-not-overwrite.json',
  ]);
  assert.equal(refusedAudit.status, 2);
  assert.match(refusedAudit.stderr, /ERROR \[OUTPUT_EXISTS\]/);
  const refusedComparison = run([
    'compare',
    'original-app.json',
    'original-app.json',
    '--output',
    'do-not-overwrite.json',
  ]);
  assert.equal(refusedComparison.status, 2);
  assert.match(refusedComparison.stderr, /ERROR \[OUTPUT_EXISTS\]/);
  assert.deepEqual(
    await readFile(confinedPath('do-not-overwrite.json')),
    protectedBytes,
  );
  assert.equal(
    await readFile(confinedPath(`${pathSecret}-before.html`), 'utf8'),
    beforeHtml,
  );
});

test('shipped CLI bounds repeated missing aria-labelledby work without writing a report', async () => {
  const adversarial = `<form>${'<input aria-labelledby="missing">'.repeat(50_000)}</form>`;
  assert.ok(Buffer.byteLength(adversarial) <= 2 * 1024 * 1024);
  await put('analysis-limit.html', adversarial);
  const started = performance.now();
  const result = run([
    'audit',
    'analysis-limit.html',
    '--app',
    'bounded-analysis',
    '--output',
    'analysis-limit.json',
  ]);
  assert.ok(
    performance.now() - started < 15_000,
    'Shipped analysis must fail within the bounded process window.',
  );
  assert.equal(result.status, 2);
  assert.match(result.stderr, /ERROR \[ANALYSIS_LIMIT\]/);
  assert.equal(result.stdout, '');
  await absent('analysis-limit.json');
});
