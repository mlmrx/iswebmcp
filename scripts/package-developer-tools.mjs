import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { zipSync } from 'fflate';

// Explicit release allowlist: no repository credentials, environment, datasets, or build output.
const files = [
  'integrations/developer-kit/package.json',
  'integrations/developer-kit/index.mjs',
  'integrations/developer-kit/index.d.ts',
  'integrations/developer-kit/bin/iswebmcp.mjs',
  'integrations/developer-kit/README.md',
  'integrations/developer-kit/LICENSE',
  'integrations/developer-kit/tests/client.test.mjs',
  'integrations/developer-kit/tests/cli.test.mjs',
  'integrations/github-action/action.yml',
  'integrations/github-action/run.mjs',
  'integrations/github-action/README.md',
  'integrations/github-action/tests/action.test.mjs',
];
const root = process.cwd();
const output = resolve(root, 'public/developer-tools');
const checkOnly = process.argv.includes('--check');
if (!checkOnly) mkdirSync(output, { recursive: true });
const version = JSON.parse(
  readFileSync(
    resolve(root, 'integrations/developer-kit/package.json'),
    'utf8',
  ),
).version;
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error('Invalid release version.');
const filename = `iswebmcp-developer-tools-${version}.zip`;
const archive = zipSync(
  Object.fromEntries(
    files.map((file) => [
      file,
      new Uint8Array(
        Buffer.from(
          readFileSync(resolve(root, file), 'utf8').replace(/\r\n/g, '\n'),
        ),
      ),
    ]),
  ),
  {
    level: 9,
    mtime: new Date(1980, 0, 2, 0, 0, 0),
  },
);
const manifest = `${JSON.stringify(
  {
    version,
    filename,
    bytes: archive.byteLength,
    sha256: createHash('sha256').update(archive).digest('hex'),
    files,
  },
  null,
  2,
)}\n`;
if (checkOnly) {
  if (
    !Buffer.from(archive).equals(readFileSync(resolve(output, filename))) ||
    readFileSync(resolve(output, 'checksums.json'), 'utf8').replace(
      /\r\n/g,
      '\n',
    ) !== manifest
  ) {
    throw new Error(
      'Developer tools download is stale. Run npm run developer:package.',
    );
  }
} else {
  writeFileSync(resolve(output, filename), archive);
  writeFileSync(resolve(output, 'checksums.json'), manifest);
}
console.log(
  `Packaged developer tools: ${files.length} allowlisted files, ${archive.byteLength} bytes.`,
);
