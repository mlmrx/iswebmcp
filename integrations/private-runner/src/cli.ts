#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { isMainThread } from 'node:worker_threads';
import {
  compareLocalReports,
  parseReportJson,
  PrivateRunnerError,
  safeText,
  VERSION,
} from './core';
import { auditIsolated } from './analysis';
import { readBoundedFile, writeExclusiveJson } from './files';

export const HELP = `isWebMCP offline HTML reviewer ${VERSION} (private reviewer build)

Usage:
  node iswebmcp-private.mjs audit <local-export.html> --app <app-page-id> --output <report.json>
  node iswebmcp-private.mjs compare <baseline.json> <current.json> --output <comparison.json>
  node iswebmcp-private.mjs --help

Node 22.13+ required. Files must be regular, valid UTF-8, nonempty, and <= 2 MiB.
Analysis uses a disposable worker: 5-second deadline, 128 MiB old-generation heap.
Choose a non-sensitive, stable app/page ID. Use trusted local directories, not links.
Outputs are new files only (mode 0600 where supported); nothing is overwritten.
No application network calls, HTML execution, browser authentication, or analytics.
UNC/device/URL paths are refused. Use trusted local disks: mapped/synced filesystems
are outside this guarantee. Use OS-level egress denial for network isolation.
No source HTML, file paths, page URLs, or goals are included in default reports.
Exported HTML is user-supplied evidence, not a complete-page or runtime verification.

Exit codes: 0 = audit completed / no new or worsened comparison findings;
            1 = comparison reports new or worsened partial/failing findings;
            2 = invalid input, incompatible/inconclusive evidence, or IO failure.
Existing failures may remain when comparison exits 0. Scores are not release gates.
`;

function options(args: string[], expected: string[]): Record<string, string> {
  if (args.length !== expected.length * 2)
    throw new PrivateRunnerError(
      'USAGE',
      'Use --help for the exact command syntax.',
    );
  const values: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (
      !expected.includes(key) ||
      Object.hasOwn(values, key) ||
      !value ||
      value.startsWith('--')
    )
      throw new PrivateRunnerError(
        'USAGE',
        'Unknown, duplicate, or missing option. Use --help.',
      );
    values[key] = value;
  }
  return values;
}

export async function runCli(
  args: string[],
  output: { stdout: (text: string) => void; stderr: (text: string) => void } = {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  },
): Promise<number> {
  try {
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 13))
      throw new PrivateRunnerError(
        'UNSUPPORTED_NODE',
        'Node 22.13 or later is required.',
      );
    if (args.length === 1 && args[0] === '--help') {
      output.stdout(HELP);
      return 0;
    }
    if (args[0] === 'audit' && args[1] && !args[1].startsWith('--')) {
      const flags = options(args.slice(2), ['--app', '--output']);
      const report = await auditIsolated(
        await readBoundedFile(args[1]),
        flags['--app'],
      );
      await writeExclusiveJson(flags['--output'], report);
      output.stdout(
        'Audit completed: provided-HTML findings saved locally. Runtime remains unknown.\n',
      );
      return 0;
    }
    if (
      args[0] === 'compare' &&
      args[1] &&
      args[2] &&
      !args[1].startsWith('--') &&
      !args[2].startsWith('--')
    ) {
      const flags = options(args.slice(3), ['--output']);
      const baseline = parseReportJson(await readBoundedFile(args[1]));
      const current = parseReportJson(await readBoundedFile(args[2]));
      const comparison = compareLocalReports(baseline, current);
      await writeExclusiveJson(flags['--output'], comparison);
      output.stdout(
        `Comparison saved locally: ${comparison.regressionCount} new or worsened finding(s); ${comparison.currentProblemCount} current partial/failing finding(s). Runtime remains unknown.\n`,
      );
      return comparison.regressed ? 1 : 0;
    }
    throw new PrivateRunnerError(
      'USAGE',
      'Use --help for the exact command syntax.',
    );
  } catch (error) {
    const message =
      error instanceof PrivateRunnerError
        ? `ERROR [${safeText(error.code, 50)}]: ${safeText(error.message)}`
        : 'ERROR [INTERNAL]: The local operation failed. No source content or file paths are included in this error.';
    output.stderr(`${message}\n`);
    return 2;
  }
}

if (
  isMainThread &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
