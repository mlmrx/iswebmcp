import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  applyCrawlAudit,
  summarizeSnapshot,
  type CrawlAuditManifest,
  type WebIndexRow,
  type WebIndexSnapshot,
} from '../../lib/web-index';
import { stringArg } from './cli';

const inputPath = path.resolve(
  stringArg('input', 'data/webmcp-index/results.ndjson'),
);
const sourcePath = path.resolve(
  stringArg('source', 'data/webmcp-index/tranco-source.json'),
);
const auditPath = path.resolve(
  stringArg('audit', 'data/webmcp-index/crawl-audit.json'),
);
const snapshotPath = path.resolve(
  stringArg('snapshot', 'data/webmcp-index/snapshot.json'),
);
const publicPath = path.resolve(
  stringArg('public', 'public/data/webmcp-index.json.gz'),
);
const lines = (await readFile(inputPath, 'utf8'))
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const rawRows = lines.map((line) => JSON.parse(line) as WebIndexRow);
const audit = JSON.parse(
  await readFile(auditPath, 'utf8'),
) as CrawlAuditManifest;
const rows = applyCrawlAudit(rawRows, audit);
const source = JSON.parse(
  await readFile(sourcePath, 'utf8'),
) as WebIndexSnapshot['source'];
const snapshot = summarizeSnapshot(rows, source, undefined, audit);
const siteRows =
  rows.length > 2_000
    ? [
        ...snapshot.rows
          .filter((row) => row.state === 'scored')
          .slice(0, 1_000),
        ...snapshot.rows.filter((row) => row.state !== 'scored').slice(0, 250),
      ]
    : snapshot.rows;
const siteSnapshot = {
  ...snapshot,
  publishedRowCount: siteRows.length,
  rows: siteRows,
};
await mkdir(path.dirname(snapshotPath), { recursive: true });
await mkdir(path.dirname(publicPath), { recursive: true });
await writeFile(snapshotPath, `${JSON.stringify(siteSnapshot, null, 2)}\n`);
await writeFile(publicPath, gzipSync(JSON.stringify(snapshot)));
console.log(
  `Built ${snapshot.status} snapshot: ${snapshot.validAttemptCount}/${snapshot.attemptedCount} valid attempts, ${snapshot.collectionErrorCount} audited collection errors, and ${snapshot.scoredCount} scored; ${siteRows.length} rows embedded in the site.`,
);
