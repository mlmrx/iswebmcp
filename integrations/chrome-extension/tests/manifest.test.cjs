/* oxlint-disable typescript/no-require-imports -- dependency-free CommonJS smoke test */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'),
);
const panel = fs.readFileSync(path.join(root, 'sidepanel.js'), 'utf8');

assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['activeTab', 'sidePanel']);
assert.deepEqual(manifest.host_permissions, ['https://iswebmcp.com/*']);
assert.ok(!manifest.permissions.includes('scripting'));
assert.ok(!manifest.permissions.includes('history'));
assert.match(panel, /textContent/);
assert.doesNotMatch(panel, /innerHTML/);
console.log('Chrome extension checks passed.');
