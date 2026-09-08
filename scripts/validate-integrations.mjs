import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const endpoint = 'https://iswebmcp.com/mcp';
const readJson = (...parts) =>
  JSON.parse(readFileSync(path.join(root, ...parts), 'utf8'));

const vscode = readJson('integrations', 'vscode', 'package.json');
assert.equal(vscode.main, './extension.js');
assert.equal(vscode.publisher, 'UnifyDynamics');
assert.equal(vscode.engines.vscode, '^1.96.0');
assert.deepEqual(
  vscode.contributes.commands.map((command) => command.command),
  ['iswebmcp.auditPublicUrl', 'iswebmcp.auditSelectedUrl', 'iswebmcp.openLab'],
);

const chatgpt = readJson(
  'integrations',
  'chatgpt-plugin',
  'submission-draft.json',
);
assert.equal(chatgpt.mcp_server_url, endpoint);
assert.equal(chatgpt.authentication, 'none');
assert.equal(chatgpt.owner_contact, 'research@iswebmcp.com');
assert.equal(chatgpt.terms_url, 'https://iswebmcp.com/terms');

const claudeManifest = readJson(
  'integrations',
  'claude-plugin',
  '.claude-plugin',
  'plugin.json',
);
const claudeMcp = readJson('integrations', 'claude-plugin', '.mcp.json');
assert.equal(claudeManifest.name, 'iswebmcp');
assert.deepEqual(claudeMcp.mcpServers.iswebmcp, {
  type: 'http',
  url: endpoint,
});

const cursorManifest = readJson('integrations', 'cursor-plugin', 'plugin.json');
const cursorMcp = readJson('integrations', 'cursor-plugin', 'mcp.json');
const cursorManifestProperties = new Set([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'logo',
  'keywords',
  'extensions',
]);
assert.equal(
  cursorManifest.$schema,
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
);
assert.ok(
  Object.keys(cursorManifest).every((key) => cursorManifestProperties.has(key)),
);
assert.equal(cursorMcp.mcpServers.iswebmcp.type, 'streamable-http');
assert.equal(cursorMcp.mcpServers.iswebmcp.url, endpoint);

const chrome = readJson('integrations', 'chrome-extension', 'manifest.json');
assert.equal(chrome.manifest_version, 3);
assert.deepEqual(chrome.permissions, ['activeTab', 'sidePanel']);
assert.deepEqual(chrome.host_permissions, ['https://iswebmcp.com/*']);

for (const required of [
  ['integrations', 'vscode', 'assets', 'icon.png'],
  ['integrations', 'claude-plugin', 'skills', 'audit-webmcp', 'SKILL.md'],
  ['integrations', 'cursor-plugin', 'skills', 'audit-webmcp', 'SKILL.md'],
  ['integrations', 'chrome-extension', 'sidepanel.html'],
  ['public', 'downloads', 'iswebmcp-vscode-1.0.0.vsix'],
  ['public', 'downloads', 'checksums.json'],
]) {
  assert.ok(existsSync(path.join(root, ...required)), required.join('/'));
}

console.log('All integration package contracts passed.');
