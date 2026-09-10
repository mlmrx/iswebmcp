import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { unzipSync } from 'fflate';

import {
  ADOPTION_CENSUS_LIMIT,
  detectWebMcpSource,
  summarizeAdoptionCensusRows,
  type AdoptionCensus,
  type AdoptionCensusRow,
} from '../../lib/adoption-census';
import {
  MAX_REDIRECTS,
  MAX_RESPONSE_BYTES,
  normalizePublicUrl,
  ScanFailure,
} from '../../lib/network';
import { robotsAllows } from '../../lib/robots';
import { numericArg, stringArg } from '../web-index/cli';

const USER_AGENT =
  'isWebMCP-Adoption-Census/1.0 (+https://iswebmcp.com/adoption; research@iswebmcp.com)';
const limit = Math.min(
  numericArg('limit', ADOPTION_CENSUS_LIMIT),
  ADOPTION_CENSUS_LIMIT,
);
const concurrency = Math.min(numericArg('concurrency', 32), 128);
const outputRoot = path.resolve(
  stringArg('output', 'public/data/adoption-census'),
);
// A corpus pass favors bounded coverage over waiting on a small number of
// slow hosts. The normal user-facing scanner keeps a longer safety budget.
const ITEM_TIMEOUT_MS = 12_000;
const HOP_TIMEOUT_MS = 4_000;

async function fastFetch(
  rawUrl: string,
  options: {
    signal: AbortSignal;
    accept: string;
    allowedMediaTypes: string[];
    returnErrorResponse?: boolean;
    allowAnyMediaType?: boolean;
  },
) {
  let current = normalizePublicUrl(rawUrl);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const hopController = new AbortController();
    const cancel = () => hopController.abort(options.signal.reason);
    options.signal.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(() => hopController.abort(), HOP_TIMEOUT_MS);
    try {
      const response = await fetch(current, {
        redirect: 'manual',
        signal: hopController.signal,
        headers: { accept: options.accept, 'user-agent': USER_AGENT },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || redirects === MAX_REDIRECTS)
          throw new ScanFailure(
            'UPSTREAM_FAILURE',
            'The target returned too many or invalid redirects.',
            502,
          );
        await response.body?.cancel();
        current = normalizePublicUrl(new URL(location, current).toString());
        continue;
      }
      if (!response.ok && !options.returnErrorResponse)
        throw new ScanFailure(
          'UPSTREAM_FAILURE',
          `The target returned HTTP ${response.status}.`,
          422,
        );
      const contentType = response.headers.get('content-type') ?? '';
      const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
      if (
        !options.allowAnyMediaType &&
        !options.allowedMediaTypes.includes(mediaType)
      )
        throw new ScanFailure(
          'UNSUPPORTED_CONTENT',
          'The target did not return supported text content.',
          415,
        );
      const body = new Uint8Array(await response.arrayBuffer());
      const bounded = body.slice(0, MAX_RESPONSE_BYTES);
      return {
        text: new TextDecoder().decode(bounded),
        finalUrl: current.toString(),
        status: response.status,
        contentType,
        bytesRead: bounded.byteLength,
        redirects,
        truncated: body.byteLength > MAX_RESPONSE_BYTES,
      };
    } catch (error) {
      if (error instanceof ScanFailure) throw error;
      if (hopController.signal.aborted)
        throw new ScanFailure(
          'UPSTREAM_TIMEOUT',
          'The target did not respond within the census timeout.',
          504,
        );
      throw new ScanFailure(
        'UPSTREAM_FAILURE',
        'The public page could not be fetched safely.',
        502,
      );
    } finally {
      clearTimeout(timeout);
      options.signal.removeEventListener('abort', cancel);
    }
  }
  throw new ScanFailure('UPSTREAM_FAILURE', 'The page could not be fetched.');
}

function pacificDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

async function fetchTrancoList(): Promise<{
  listId: string;
  listDate: string;
  listUrl: string;
  targets: Array<{ rank: number; domain: string }>;
}> {
  const listIdResponse = await fetch('https://tranco-list.eu/top-1m-id', {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!listIdResponse.ok)
    throw new Error('Could not resolve the latest Tranco list ID.');
  const listId = (await listIdResponse.text()).trim();
  if (!/^[A-Z0-9]+$/i.test(listId))
    throw new Error('Tranco returned an invalid list ID.');

  const listResponse = await fetch('https://tranco-list.eu/top-1m.csv.zip', {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!listResponse.ok)
    throw new Error('Could not download the latest Tranco list.');
  const entries = unzipSync(new Uint8Array(await listResponse.arrayBuffer()));
  const csvEntry = Object.entries(entries).find(([name]) =>
    name.endsWith('.csv'),
  );
  if (!csvEntry) throw new Error('The Tranco archive did not contain a CSV.');
  const lines = new TextDecoder()
    .decode(csvEntry[1])
    .trim()
    .split(/\r?\n/)
    .slice(0, limit);
  const targets = lines
    .map((line) => {
      const [rawRank, rawDomain] = line.split(',', 2);
      return { rank: Number(rawRank), domain: rawDomain?.trim().toLowerCase() };
    })
    .filter(
      (item): item is { rank: number; domain: string } =>
        Number.isInteger(item.rank) && item.rank > 0 && Boolean(item.domain),
    );
  const listDate = listResponse.headers.get('last-modified')
    ? new Date(listResponse.headers.get('last-modified') as string)
        .toISOString()
        .slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    listId,
    listDate,
    listUrl: `https://tranco-list.eu/list/${listId}/full`,
    targets,
  };
}

function failureCode(error: unknown): string | undefined {
  return error instanceof ScanFailure ? error.code : undefined;
}

async function robotsState(
  origin: string,
  signal: AbortSignal,
): Promise<'allowed' | 'blocked' | 'unreachable'> {
  try {
    const result = await fastFetch(`${origin}/robots.txt`, {
      accept: 'text/plain,text/html;q=0.2',
      allowedMediaTypes: ['text/plain', 'text/html'],
      returnErrorResponse: true,
      allowAnyMediaType: true,
      signal,
    });
    if (result.status === 401 || result.status === 403 || result.status >= 500)
      return 'blocked';
    if (result.status >= 400) return 'allowed';
    return robotsAllows(result.text, '/', 'iswebmcp-adoption-census')
      ? 'allowed'
      : 'blocked';
  } catch {
    return 'unreachable';
  }
}

async function scanTargetOnce(
  target: { rank: number; domain: string },
  checkedAt: string,
): Promise<AdoptionCensusRow> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ITEM_TIMEOUT_MS);
  const url = `https://${target.domain}/`;
  try {
    const robots = await robotsState(
      `https://${target.domain}`,
      controller.signal,
    );
    if (robots === 'blocked') {
      return {
        popularityRank: target.rank,
        domain: target.domain,
        url,
        state: 'robots-blocked',
        checkedAt,
      };
    }
    if (robots === 'unreachable') {
      return {
        popularityRank: target.rank,
        domain: target.domain,
        url,
        state: 'unreachable',
        checkedAt,
        errorCode: 'UPSTREAM_FAILURE',
      };
    }
    try {
      const fetched = await fastFetch(url, {
        accept: 'text/html,application/xhtml+xml',
        allowedMediaTypes: ['text/html', 'application/xhtml+xml'],
        signal: controller.signal,
      });
      const detection = detectWebMcpSource(fetched.text);
      if (!detection.detected) {
        return {
          popularityRank: target.rank,
          domain: target.domain,
          url,
          finalUrl: fetched.finalUrl,
          state: 'not-detected',
          checkedAt,
          bytesRead: fetched.bytesRead,
          redirects: fetched.redirects,
        };
      }
      return {
        popularityRank: target.rank,
        domain: target.domain,
        url,
        finalUrl: fetched.finalUrl,
        state: 'detected',
        surface: detection.surface,
        signals: detection.signals,
        tools: detection.tools,
        checkedAt,
        bytesRead: fetched.bytesRead,
        redirects: fetched.redirects,
      };
    } catch (error) {
      const code = failureCode(error);
      return {
        popularityRank: target.rank,
        domain: target.domain,
        url,
        state: code === 'UNSUPPORTED_CONTENT' ? 'unsupported' : 'unreachable',
        checkedAt,
        errorCode: code ?? 'UPSTREAM_FAILURE',
      };
    }
  } catch (error) {
    return {
      popularityRank: target.rank,
      domain: target.domain,
      url,
      state: 'unreachable',
      checkedAt,
      errorCode: failureCode(error) ?? 'UPSTREAM_TIMEOUT',
    };
  } finally {
    clearTimeout(timeout);
    const elapsed = Date.now() - started;
    if (elapsed > ITEM_TIMEOUT_MS) controller.abort();
  }
}

async function scanTarget(
  target: { rank: number; domain: string },
  checkedAt: string,
): Promise<AdoptionCensusRow> {
  const timeoutRow: AdoptionCensusRow = {
    popularityRank: target.rank,
    domain: target.domain,
    url: `https://${target.domain}/`,
    state: 'unreachable',
    checkedAt,
    errorCode: 'UPSTREAM_TIMEOUT',
  };
  return Promise.race([
    scanTargetOnce(target, checkedAt),
    new Promise<AdoptionCensusRow>((resolve) =>
      setTimeout(() => resolve(timeoutRow), ITEM_TIMEOUT_MS),
    ),
  ]);
}

const now = new Date();
const checkedAt = now.toISOString();
const date = pacificDate(now);
const source = await fetchTrancoList();
const rows: AdoptionCensusRow[] = [];
for (let offset = 0; offset < source.targets.length; offset += concurrency) {
  const batch = source.targets.slice(offset, offset + concurrency);
  rows.push(
    ...(await Promise.all(
      batch.map((target) => scanTarget(target, checkedAt)),
    )),
  );
  const detected = rows.filter((row) => row.state === 'detected').length;
  console.log(
    `${rows.length.toLocaleString()}/${source.targets.length.toLocaleString()} checked · ${detected} WebMCP source signals`,
  );
}
rows.sort((left, right) => left.popularityRank - right.popularityRank);
const coverage = summarizeAdoptionCensusRows(rows, source.targets.length);
const auditDigest = createHash('sha256')
  .update(
    rows
      .map(
        (row) =>
          `${row.popularityRank}\t${row.domain}\t${row.state}\t${row.surface ?? ''}\n`,
      )
      .join(''),
  )
  .digest('hex');
const census: AdoptionCensus = {
  schemaVersion: 1,
  generatedAt: checkedAt,
  scope: 'tranco-top-10000',
  source: {
    name: 'Tranco',
    listId: source.listId,
    listUrl: source.listUrl,
    listDate: source.listDate,
    description:
      'A reproducible research ranking of popular domains; used as a popularity proxy, not direct traffic measurement.',
  },
  coverage,
  auditDigest,
  rowPolicy:
    'The denominator includes every scheduled domain and every collection outcome. The retained detections array contains only positive WebMCP source signals; not-detected and blocked domains remain represented in coverage counts.',
  detections: rows
    .filter((row) => row.state === 'detected')
    .map((row) => ({
      popularityRank: row.popularityRank,
      domain: row.domain,
      url: row.url,
      finalUrl: row.finalUrl,
      state: 'detected' as const,
      surface: row.surface ?? 'unknown',
      signals: row.signals ?? [],
      tools: row.tools ?? [],
      checkedAt: row.checkedAt,
      bytesRead: row.bytesRead,
      redirects: row.redirects,
    })),
};
await mkdir(outputRoot, { recursive: true });
const serialized = `${JSON.stringify(census, null, 2)}\n`;
await writeFile(path.join(outputRoot, `${date}.json`), serialized, 'utf8');
await writeFile(path.join(outputRoot, 'latest.json'), serialized, 'utf8');
console.log(
  `Published ${date}: ${coverage.detectedCount}/${coverage.scheduledCount} domains with WebMCP source signals; ${coverage.namedToolDefinitions} named tools.`,
);
