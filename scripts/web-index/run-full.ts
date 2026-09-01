import { spawn } from 'node:child_process';

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

console.log(
  `[${new Date().toISOString()}] Continuing the 100,000-domain crawl.`,
);
await run('npx', [
  'tsx',
  'scripts/web-index/crawl-index.ts',
  '--limit',
  '100000',
  '--concurrency',
  '16',
]);
await run('npx', ['tsx', 'scripts/web-index/build-snapshot.ts']);
await run('npm', ['run', 'typecheck']);
await run('npm', ['test']);
await run('npm', ['run', 'build']);
await run('git', [
  'add',
  'data/webmcp-index/results.ndjson',
  'data/webmcp-index/snapshot.json',
  'public/data/webmcp-index.json.gz',
]);
await run('git', [
  'commit',
  '-m',
  'data: publish full 100k WebMCP readiness snapshot',
]);
await run('git', ['push', 'origin', 'HEAD']);
console.log(`[${new Date().toISOString()}] Full index published to GitHub.`);
