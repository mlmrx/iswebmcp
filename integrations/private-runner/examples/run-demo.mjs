import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Owned synthetic files only. No shell, network requests, uploads, or cleanup.
async function ensureTrustedPath(target, directory = false) {
  assert.ok(!/^(?:\\\\|\/\/|\\\?\?\\)/.test(target));
  let cursor = path.resolve(target);
  assert.ok(!/^(?:\\\\|\/\/)/.test(cursor));
  const leaf = cursor;
  for (;;) {
    const info = await fs.lstat(cursor);
    assert.ok(!info.isSymbolicLink());
    assert.ok(
      cursor === leaf && !directory ? info.isFile() : info.isDirectory(),
    );
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
}

async function main() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  assert.ok(major > 22 || (major === 22 && minor >= 13));
  const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
  await ensureTrustedPath(root, true);
  const checker = path.join(root, 'iswebmcp-offline.mjs');
  const before = path.join(root, 'examples', 'before.html');
  const after = path.join(root, 'examples', 'after.html');
  for (const target of [checker, before, after])
    await ensureTrustedPath(target);

  // mkdtemp creates a new directory on every run; no existing result is replaced.
  const results = await fs.mkdtemp(path.join(root, 'demo-results-'));
  assert.equal(path.dirname(results), root);
  assert.match(path.basename(results), /^demo-results-[a-zA-Z0-9]+$/);
  await ensureTrustedPath(results, true);
  const outputPath = (name) => {
    assert.match(name, /^[a-z-]+\.json$/);
    const target = path.join(results, name);
    assert.equal(path.dirname(target), results);
    return target;
  };
  const run = (args, expected) => {
    const result = spawnSync(process.execPath, [checker, ...args], {
      cwd: root,
      shell: false,
      encoding: 'utf8',
      timeout: 15_000,
      maxBuffer: 128_000,
      windowsHide: true,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, expected);
  };
  const read = async (name) => {
    const target = outputPath(name);
    await ensureTrustedPath(target);
    const info = await fs.stat(target);
    assert.ok(info.size > 0 && info.size <= 2 * 1024 * 1024);
    return JSON.parse(await fs.readFile(target, 'utf8'));
  };
  const audit = (input, name) =>
    run(
      [
        'audit',
        input,
        '--app',
        'demo-catalog-search',
        '--output',
        outputPath(name),
      ],
      0,
    );
  audit(before, 'before.json');
  audit(after, 'fixed.json');
  audit(before, 'regressed.json');
  const initial = await read('before.json');
  const fixed = await read('fixed.json');
  const regressed = await read('regressed.json');
  const names = (report) =>
    report.findings.find((finding) => finding.ruleId === 'UI_ACCESSIBLE_NAMES');
  assert.equal(names(initial)?.status, 'fail');
  assert.equal(names(fixed)?.status, 'pass');
  assert.equal(names(regressed)?.status, 'fail');
  for (const report of [initial, fixed, regressed]) {
    assert.equal(report.reportKind, 'provided_html');
    assert.equal(report.sourceScope, 'provided-html-only');
    assert.equal(report.runtime, 'unknown');
  }
  run(
    [
      'compare',
      outputPath('before.json'),
      outputPath('fixed.json'),
      '--output',
      outputPath('fix-comparison.json'),
    ],
    0,
  );
  run(
    [
      'compare',
      outputPath('fixed.json'),
      outputPath('regressed.json'),
      '--output',
      outputPath('regression-comparison.json'),
    ],
    1,
  );
  const fix = await read('fix-comparison.json');
  const regression = await read('regression-comparison.json');
  assert.equal(fix.regressed, false);
  assert.equal(fix.regressionCount, 0);
  assert.equal(regression.regressed, true);
  assert.equal(regression.regressionCount, 1);
  assert.deepEqual(
    regression.changes.find(
      (finding) => finding.ruleId === 'UI_ACCESSIBLE_NAMES',
    )?.regressionReasons,
    ['new-problem'],
  );
  process.stdout.write('Before: UI_ACCESSIBLE_NAMES = fail\n');
  process.stdout.write('After adding a label: UI_ACCESSIBLE_NAMES = pass\n');
  process.stdout.write('Fix comparison: exit 0; 0 new or worsened findings\n');
  process.stdout.write('Removing the label again: exit 1; 1 new problem\n');
  process.stdout.write(`Results retained in ./${path.basename(results)}/\n`);
  process.stdout.write(
    'Runtime remains unknown. This demo verifies a source-level label change, not task success.\n',
  );
}

main().catch(() => {
  process.stderr.write(
    'Demo failed. Use Node 22.13+ and the complete extracted ZIP on a writable, trusted local disk. No existing results were overwritten or deleted.\n',
  );
  process.exitCode = 2;
});
