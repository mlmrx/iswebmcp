import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, readFile, realpath, lstat, open } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { build, version as esbuildVersion } from 'esbuild';
import { zipSync } from 'fflate';

// Private review artifact only. Never write into public/ or include workspace data.
const root = process.cwd();
const output = resolve(root, 'artifacts/private-runner');
const packagePath = 'integrations/private-runner/package.json';
const entry = 'integrations/private-runner/src/cli.ts';
const packageInfo = JSON.parse(
  await readFile(resolve(root, packagePath), 'utf8'),
);
if (!/^\d+\.\d+\.\d+$/.test(packageInfo.version))
  throw new Error('Invalid version.');
const filename = `iswebmcp-private-runner-${packageInfo.version}.zip`;
const sourceAllowlist = [
  entry,
  'integrations/private-runner/src/analysis.ts',
  'integrations/private-runner/src/core.ts',
  'integrations/private-runner/src/files.ts',
  'lib/scanner.ts',
  'lib/scoring.ts',
  'lib/demo.ts',
  'lib/types.ts',
];
const allowedBuiltins = new Set([
  'node:crypto',
  'node:fs',
  'node:fs/promises',
  'node:path',
  'node:url',
  'node:util',
  'node:worker_threads',
]);
const bundled = await build({
  absWorkingDir: root,
  entryPoints: [entry],
  outfile: 'iswebmcp-private.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22.13',
  write: false,
  metafile: true,
  legalComments: 'inline',
  sourcemap: false,
});
const inputPaths = Object.keys(bundled.metafile.inputs).map((path) =>
  path.replaceAll('\\', '/'),
);
for (const path of inputPaths) {
  if (!sourceAllowlist.includes(path))
    throw new Error(`Unreviewed bundle input: ${path}`);
}
for (const info of Object.values(bundled.metafile.outputs)) {
  for (const dependency of info.imports) {
    if (!dependency.external || !allowedBuiltins.has(dependency.path)) {
      throw new Error(`Unreviewed runtime dependency: ${dependency.path}`);
    }
  }
}
if (bundled.outputFiles.length !== 1)
  throw new Error('Expected one standalone executable.');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const textBytes = async (path) =>
  Buffer.from(
    (await readFile(resolve(root, path), 'utf8')).replace(/\r\n/g, '\n'),
  );
const files = {
  'iswebmcp-private.mjs': bundled.outputFiles[0].contents,
  'README.md': await textBytes('integrations/private-runner/README.md'),
  LICENSE: await textBytes('integrations/private-runner/LICENSE'),
  'package.json': await textBytes(packagePath),
};
for (const path of sourceAllowlist)
  files[`source/${path}`] = await textBytes(path);
const provenance = {
  schemaVersion: 'iswebmcp-private-build/v1',
  distribution: 'private-review-artifact',
  version: packageInfo.version,
  compiler: { name: 'esbuild', version: esbuildVersion, target: 'node22.13' },
  entry: 'iswebmcp-private.mjs',
  runtimeDependencies: [
    ...new Set(
      Object.values(bundled.metafile.outputs).flatMap((info) =>
        info.imports.map((dependency) => dependency.path),
      ),
    ),
  ].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)),
  inputs: await Promise.all(
    sourceAllowlist.map(async (path) => ({
      path,
      sha256: sha256(await textBytes(path)),
    })),
  ),
  limitations: [
    'Checksums bind bytes, not publisher identity or evidence authenticity.',
    'Provided HTML is not live HTTP or browser evidence.',
    'This artifact is not an enterprise security certification or hosted service.',
  ],
};
files['build-provenance.json'] = Buffer.from(
  `${JSON.stringify(provenance, null, 2)}\n`,
);
const archive = zipSync(files, {
  level: 9,
  mtime: new Date(1980, 0, 2, 0, 0, 0),
});
const manifest = `${JSON.stringify(
  {
    ...provenance,
    filename,
    bytes: archive.byteLength,
    sha256: sha256(archive),
    files: Object.entries(files).map(([path, bytes]) => ({
      path,
      bytes: bytes.length,
      sha256: sha256(bytes),
    })),
  },
  null,
  2,
)}\n`;
for (let path = output; path !== dirname(path); path = dirname(path)) {
  try {
    if ((await lstat(path)).isSymbolicLink())
      throw new Error('Symlink artifact paths are not allowed.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
await mkdir(output, { recursive: true });
const resolvedOutput = await realpath(output);
const withinRoot = relative(await realpath(root), resolvedOutput);
if (
  withinRoot.startsWith('..') ||
  isAbsolute(withinRoot) ||
  relative(output, resolvedOutput) !== ''
)
  throw new Error(
    'Artifact output must remain in the exact private artifact directory.',
  );
async function writeExclusiveOrIdentical(path, bytes) {
  let handle;
  try {
    handle = await open(path, 'wx', 0o600);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== bytes.length)
      throw new Error(
        'An output already exists; preserve it and choose a new review version.',
      );
    const reader = await open(
      path,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    try {
      const opened = await reader.stat();
      if (
        !opened.isFile() ||
        opened.ino !== info.ino ||
        (opened.dev !== info.dev &&
          !(
            process.platform === 'win32' &&
            (opened.dev === 0 || info.dev === 0)
          )) ||
        opened.size !== bytes.length
      )
        throw new Error('Artifact changed during verification.');
      const existing = Buffer.alloc(bytes.length);
      let offset = 0;
      while (offset < existing.length) {
        const result = await reader.read(
          existing,
          offset,
          existing.length - offset,
          offset,
        );
        if (!result.bytesRead) break;
        offset += result.bytesRead;
      }
      const after = await lstat(path);
      if (
        after.isSymbolicLink() ||
        after.ino !== info.ino ||
        after.dev !== info.dev ||
        after.size !== bytes.length ||
        after.mtimeMs !== info.mtimeMs ||
        offset !== existing.length ||
        !existing.equals(Buffer.from(bytes))
      )
        throw new Error(
          'An output differs or changed; preserve it and choose a new review version.',
        );
    } finally {
      await reader.close();
    }
    return;
  }
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}
// Generated, unpublished review artifacts. Never overwrite a previous build or a symlink.
await writeExclusiveOrIdentical(resolve(resolvedOutput, filename), archive);
await writeExclusiveOrIdentical(
  resolve(resolvedOutput, filename.replace('.zip', '.checksums.json')),
  Buffer.from(manifest),
);
console.log(
  JSON.stringify({
    filename,
    bytes: archive.byteLength,
    sha256: sha256(archive),
    output: resolvedOutput,
    public: false,
  }),
);
