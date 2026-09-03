/* oxlint-disable typescript/no-require-imports -- dependency-free CommonJS smoke test */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const source = fs.readFileSync(path.join(root, 'extension.js'), 'utf8');

assert.equal(manifest.main, './extension.js');
assert.equal(manifest.engines.vscode, '^1.96.0');
assert.ok(
  manifest.contributes.commands.some(
    (item) => item.command === 'iswebmcp.auditPublicUrl',
  ),
);
assert.match(source, /enableScripts: false/);
assert.match(source, /escapeHtml/);
assert.doesNotMatch(source, /innerHTML\s*=/);
console.log('VS Code extension checks passed.');
