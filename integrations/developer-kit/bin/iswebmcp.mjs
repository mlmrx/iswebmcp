#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scan, compare, IsWebMCPError } from '../index.mjs';

const help = `isWebMCP developer kit (Node 22.13+)

  iswebmcp scan <public-url> [--output report.json] [--json]
      [--goal text] [--timeout milliseconds] [--include-query]
  iswebmcp compare <baseline.json> <current.json> [--output diff.json] [--json]

Source-only inspection. No browser execution or runtime proof.
URLs and optional goals are sent to iswebmcp.com. Queries/fragments are stripped
before transmission by default. --include-query sends the query explicitly.
Output files are created exclusively: use a new path for each report.
Comparisons require two v2 reports with identical scan inputs and complete findings.
Exit codes: 0 completed/no summary regression; 1 summary regression;
2 invalid input, unavailable service, partial collection, or not comparable.
`;

function parse(args) {
  if (!args.length || args.includes('--help') || args[0] === 'help')
    return { help: true };
  const [command, ...rest] = args;
  if (!['scan', 'compare'].includes(command))
    throw new IsWebMCPError('INVALID_INPUT', 'Use scan or compare.');
  const options = {};
  const positionals = [];
  const values = new Set(
    command === 'scan' ? ['--output', '--goal', '--timeout'] : ['--output'],
  );
  const flags = new Set(
    command === 'scan' ? ['--json', '--include-query'] : ['--json'],
  );
  for (let index = 0; index < rest.length; index++) {
    const arg = rest[index];
    if (flags.has(arg)) {
      if (options[arg] !== undefined)
        throw new IsWebMCPError('INVALID_INPUT', `Duplicate option: ${arg}`);
      options[arg] = true;
    } else if (values.has(arg)) {
      if (
        options[arg] !== undefined ||
        !rest[index + 1] ||
        rest[index + 1].startsWith('--')
      )
        throw new IsWebMCPError(
          'INVALID_INPUT',
          `Provide one value for ${arg}.`,
        );
      options[arg] = rest[++index];
    } else if (arg.startsWith('-'))
      throw new IsWebMCPError('INVALID_INPUT', `Unknown option: ${arg}`);
    else positionals.push(arg);
  }
  if (positionals.length !== (command === 'scan' ? 1 : 2))
    throw new IsWebMCPError(
      'INVALID_INPUT',
      `Incorrect arguments for ${command}. Use --help.`,
    );
  return { command, options, positionals };
}

async function save(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  });
}

// Prevent untrusted target text from emitting terminal escape/control sequences.
const clean = (text) =>
  Array.from(String(text), (character) => {
    const code = character.codePointAt(0);
    return code < 32 || (code >= 127 && code <= 159) ? ' ' : character;
  }).join('');

export async function main(
  args,
  { stdout = process.stdout, stderr = process.stderr, scanFn = scan } = {},
) {
  try {
    const parsed = parse(args);
    if (parsed.help) {
      stdout.write(help);
      return 0;
    }
    const { command, options, positionals } = parsed;
    const value =
      command === 'scan'
        ? await scanFn(positionals[0], {
            goal: options['--goal'],
            includeQuery: Boolean(options['--include-query']),
            ...(options['--timeout'] !== undefined
              ? { timeoutMs: Number(options['--timeout']) }
              : {}),
          })
        : compare(
            JSON.parse(await readFile(positionals[0], 'utf8')),
            JSON.parse(await readFile(positionals[1], 'utf8')),
          );
    if (options['--output']) await save(options['--output'], value);
    if (options['--json']) stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    else if (command === 'scan') {
      stdout.write(
        `Source-only scan: ${clean(value.url)}\nCollection: ${value.collection.status}\nRuntime: unknown; lift: withheld\n`,
      );
      for (const finding of value.findings)
        stdout.write(
          `- ${clean(finding.status)} (${clean(finding.severity)}): ${clean(finding.title)}\n  ${clean(finding.recommendation)}\n`,
        );
      stdout.write(
        'Results reflect a bounded source summary, not runtime task completion.\n',
      );
      for (const limitation of value.limitations)
        stdout.write(`Limit: ${clean(limitation)}\n`);
    } else {
      stdout.write(
        `${value.regressionCount} new or worsened source-summary finding(s).\n`,
      );
      for (const change of value.changes.filter((item) => item.regressed))
        stdout.write(
          `- ${clean(change.title)} [${clean(change.ruleId)}]: ${clean(change.after.status)} (${clean(change.after.severity)})\n  Reasons: ${change.regressionReasons.map(clean).join(', ')}\n  ${clean(change.recommendation)}\n`,
        );
      for (const limitation of value.limitations)
        stdout.write(`Limit: ${clean(limitation)}\n`);
    }
    if (
      command === 'scan' &&
      (value.collection.status !== 'complete' || value.collection.truncated)
    ) {
      stderr.write(
        'PARTIAL_COLLECTION: Report saved/returned, but collection is incomplete; do not use it as a release gate.\n',
      );
      return 2;
    }
    return command === 'compare' && value.regressed ? 1 : 0;
  } catch (error) {
    const code =
      error instanceof IsWebMCPError
        ? error.code
        : error.code === 'EEXIST'
          ? 'OUTPUT_EXISTS'
          : 'LOCAL_ERROR';
    const message =
      code === 'OUTPUT_EXISTS'
        ? 'Output file already exists. Choose a new path to preserve your baseline.'
        : error.message;
    stderr.write(`${clean(code)}: ${clean(message)}\n`);
    if (error.retryAfter)
      stderr.write(
        `Retry after: ${clean(error.retryAfter)}. No automatic retry was attempted.\n`,
      );
    return 2;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await main(process.argv.slice(2));
}
