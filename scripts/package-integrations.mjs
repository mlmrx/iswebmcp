import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { zipSync } from 'fflate';

const root = process.cwd();
const downloads = path.join(root, 'public', 'downloads');
mkdirSync(downloads, { recursive: true });

const packages = [
  ['chatgpt-plugin', 'iswebmcp-chatgpt-plugin-1.0.0.zip'],
  ['claude-plugin', 'iswebmcp-claude-plugin-1.0.0.zip'],
  ['cursor-plugin', 'iswebmcp-cursor-plugin-1.0.0.zip'],
  ['chrome-extension', 'iswebmcp-chrome-extension-1.0.0.zip'],
];
const deterministicMtime = new Date('1980-01-02T00:00:00.000Z');

function collect(directory, base = directory, result = {}) {
  for (const name of readdirSync(directory)) {
    const absolute = path.join(directory, name);
    const relative = path.relative(base, absolute).split(path.sep).join('/');
    const stat = statSync(absolute);
    if (stat.isDirectory()) collect(absolute, base, result);
    else result[relative] = new Uint8Array(readFileSync(absolute));
  }
  return result;
}

for (const [directory, filename] of packages) {
  const input = path.join(root, 'integrations', directory);
  const output = path.join(downloads, filename);
  writeFileSync(
    output,
    zipSync(collect(input), { level: 9, mtime: deterministicMtime }),
  );
}

const artifactNames = [
  'iswebmcp-vscode-1.0.0.vsix',
  ...packages.map(([, filename]) => filename),
];
const checksums = artifactNames.map((filename) => {
  const absolute = path.join(downloads, filename);
  if (!existsSync(absolute)) {
    throw new Error(`Missing integration artifact: ${filename}`);
  }
  const data = readFileSync(absolute);
  return {
    filename,
    bytes: data.byteLength,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
});

writeFileSync(
  path.join(downloads, 'checksums.json'),
  `${JSON.stringify({ version: '1.0.0', artifacts: checksums }, null, 2)}\n`,
);

for (const artifact of checksums) {
  console.log(
    `${artifact.filename} ${artifact.bytes} bytes ${artifact.sha256}`,
  );
}
