import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  fetchPublicText,
  MAX_RESPONSE_BYTES,
  ScanFailure,
} from '../../lib/network';
import { robotsAllows } from '../../lib/robots';
import { analyzeSource } from '../../lib/scanner';
import {
  rowFromReport,
  type IndexState,
  type WebIndexRow,
} from '../../lib/web-index';
import { numericArg, stringArg } from './cli';

const USER_AGENT =
  'isWebMCP-Research/1.0 (+https://iswebmcp.com/readiness-index-methodology; research@iswebmcp.com)';
const CRAWL_ITEM_WATCHDOG_MS = 70_000;
const limit = numericArg('limit', 100_000);
const concurrency = Math.min(numericArg('concurrency', 4), 32);
const inputPath = path.resolve(
  stringArg('input', 'data/webmcp-index/tranco-top.csv'),
);
const outputPath = path.resolve(
  stringArg('output', 'data/webmcp-index/results.ndjson'),
);

function unscoredRow(
  rank: number,
  domain: string,
  state: IndexState,
  startedAt: number,
  errorCode?: WebIndexRow['errorCode'],
): WebIndexRow {
  return {
    popularityRank: rank,
    domain,
    state,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    errorCode,
  };
}

async function fetchRobots(
  origin: string,
): Promise<'allowed' | 'blocked' | 'unreachable'> {
  try {
    const result = await fetchPublicText(`${origin}/robots.txt`, {
      userAgent: USER_AGENT,
      accept: 'text/plain,text/html;q=0.2',
      allowedMediaTypes: ['text/plain', 'text/html'],
      returnErrorResponse: true,
    });
    if (
      result.status === 401 ||
      result.status === 403 ||
      result.status >= 500
    ) {
      return 'blocked';
    }
    if (result.status >= 400) return 'allowed';
    return robotsAllows(result.text, '/', 'iswebmcp-research')
      ? 'allowed'
      : 'blocked';
  } catch {
    return 'unreachable';
  }
}

async function scanOrigin(
  rank: number,
  domain: string,
  scheme: 'https' | 'http',
  startedAt: number,
): Promise<WebIndexRow> {
  const origin = `${scheme}://${domain}`;
  const robots = await fetchRobots(origin);
  if (robots === 'blocked') {
    return unscoredRow(rank, domain, 'robots_blocked', startedAt);
  }
  if (robots === 'unreachable') {
    return unscoredRow(
      rank,
      domain,
      'unreachable',
      startedAt,
      'UPSTREAM_FAILURE',
    );
  }
  try {
    const fetched = await fetchPublicText(`${origin}/`, {
      userAgent: USER_AGENT,
    });
    const report = analyzeSource({
      normalizedUrl: `${origin}/`,
      finalUrl: fetched.finalUrl,
      html: fetched.text,
      status: fetched.status,
      contentType: fetched.contentType,
      bytesRead: fetched.bytesRead,
      declaredBytes: fetched.declaredBytes,
      analysisLimitBytes: MAX_RESPONSE_BYTES,
      truncated: fetched.truncated,
      redirects: fetched.redirects,
    });
    return rowFromReport(rank, domain, report, Date.now() - startedAt);
  } catch (error) {
    const code = error instanceof ScanFailure ? error.code : 'UPSTREAM_FAILURE';
    const state: IndexState =
      code === 'UNSUPPORTED_CONTENT'
        ? 'unsupported'
        : code === 'UNSAFE_TARGET'
          ? 'unsafe'
          : 'unreachable';
    return unscoredRow(rank, domain, state, startedAt, code);
  }
}

async function scan(rank: number, domain: string): Promise<WebIndexRow> {
  const startedAt = Date.now();
  const secure = await scanOrigin(rank, domain, 'https', startedAt);
  if (secure.state !== 'unreachable') return secure;
  return scanOrigin(rank, domain, 'http', startedAt);
}

async function scanWithWatchdog(
  rank: number,
  domain: string,
): Promise<WebIndexRow> {
  const startedAt = Date.now();
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      scan(rank, domain),
      new Promise<WebIndexRow>((resolve) => {
        watchdog = setTimeout(
          () =>
            resolve(
              unscoredRow(
                rank,
                domain,
                'unreachable',
                startedAt,
                'UPSTREAM_TIMEOUT',
              ),
            ),
          CRAWL_ITEM_WATCHDOG_MS,
        );
      }),
    ]);
  } finally {
    if (watchdog) clearTimeout(watchdog);
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
const input = (await readFile(inputPath, 'utf8'))
  .trim()
  .split(/\r?\n/)
  .slice(0, limit);
const existingText = await readFile(outputPath, 'utf8').catch(() => '');
const completed = new Set(
  existingText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => (JSON.parse(line) as WebIndexRow).popularityRank),
);
const targets = input
  .map((line) => {
    const [rank, domain] = line.split(',', 2);
    return { rank: Number(rank), domain };
  })
  .filter(({ rank, domain }) => rank && domain && !completed.has(rank));

for (let offset = 0; offset < targets.length; offset += concurrency) {
  const batch = targets.slice(offset, offset + concurrency);
  const rows = await Promise.all(
    batch.map(({ rank, domain }) => scanWithWatchdog(rank, domain)),
  );
  await appendFile(
    outputPath,
    `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`,
  );
  const finished = completed.size + offset + rows.length;
  console.log(
    `${finished.toLocaleString()}/${input.length.toLocaleString()} attempted · ${rows.filter((row) => row.state === 'scored').length}/${rows.length} scored in batch`,
  );
}
