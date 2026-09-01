import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  summarizeSnapshot,
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
const latest = new Map<number, WebIndexRow>();
for (const line of lines) {
  const row = JSON.parse(line) as WebIndexRow;
  latest.set(row.popularityRank, row);
}
const rows = [...latest.values()].sort(
  (a, b) => a.popularityRank - b.popularityRank,
);
const source = JSON.parse(
  await readFile(sourcePath, 'utf8'),
) as WebIndexSnapshot['source'];
const snapshot = summarizeSnapshot(rows, source);
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
  `Built ${snapshot.status} snapshot: ${snapshot.scoredCount}/${snapshot.attemptedCount} scored; ${siteRows.length} rows embedded in the site.`,
);
