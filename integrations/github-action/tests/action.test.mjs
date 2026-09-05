import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('../run.mjs', import.meta.url));
const run = (inputs) =>
  spawnSync(process.execPath, [runner], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ISWEBMCP_TARGET: '',
      ISWEBMCP_BASELINE: '',
      ISWEBMCP_OUTPUT: '',
      ISWEBMCP_DIFF: '',
      ...inputs,
    },
  });

test('rejects an absent target without invoking the network', () => {
  const result = run({});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /url input/);
});
test('rejects overlapping baseline and output paths before scanning', () => {
  const result = run({
    ISWEBMCP_TARGET: 'https://example.com',
    ISWEBMCP_BASELINE: './report.json',
    ISWEBMCP_OUTPUT: 'report.json',
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /separate file paths/);
});
test('passes a target as a literal argument, without shell expansion', () => {
  const result = run({ ISWEBMCP_TARGET: '$(exit 47)' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /INVALID_INPUT/);
});
