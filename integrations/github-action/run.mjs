import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(
  new URL('../developer-kit/bin/iswebmcp.mjs', import.meta.url),
);
const target = process.env.ISWEBMCP_TARGET;
const baseline = process.env.ISWEBMCP_BASELINE;
const output = process.env.ISWEBMCP_OUTPUT || 'iswebmcp-current.json';
const diff = process.env.ISWEBMCP_DIFF || 'iswebmcp-comparison.json';

if (!target) {
  console.error('Set the url input to a public URL.');
  process.exit(2);
}
const paths = [output, ...(baseline ? [baseline, diff] : [])].map((path) =>
  resolve(path),
);
if (new Set(paths).size !== paths.length) {
  console.error(
    'Baseline, current result, and comparison must use separate file paths.',
  );
  process.exit(2);
}

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) {
    console.error('Unable to run the isWebMCP developer toolkit.');
    process.exit(2);
  }
  return result.status ?? 2;
}

const scanStatus = run(['scan', target, '--output', output]);
if (scanStatus !== 0) process.exit(scanStatus);
if (baseline)
  process.exit(run(['compare', baseline, output, '--output', diff]));
