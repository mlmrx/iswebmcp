import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { unzipSync } from 'fflate';

import { numericArg } from './cli';

const limit = Math.min(numericArg('limit', 100_000), 1_000_000);
const outputDir = path.resolve('data/webmcp-index');
const listIdResponse = await fetch('https://tranco-list.eu/top-1m-id');
if (!listIdResponse.ok)
  throw new Error('Could not resolve the latest Tranco list ID.');
const listId = (await listIdResponse.text()).trim();
if (!/^[A-Z0-9]+$/i.test(listId))
  throw new Error('Tranco returned an invalid list ID.');

const listResponse = await fetch('https://tranco-list.eu/top-1m.csv.zip');
if (!listResponse.ok)
  throw new Error('Could not download the latest Tranco list.');
const archive = new Uint8Array(await listResponse.arrayBuffer());
const entries = unzipSync(archive);
const csvEntry = Object.entries(entries).find(([name]) =>
  name.endsWith('.csv'),
);
if (!csvEntry)
  throw new Error('The Tranco archive did not contain a CSV file.');
const lines = new TextDecoder()
  .decode(csvEntry[1])
  .trim()
  .split(/\r?\n/)
  .slice(0, limit);
const listDate = listResponse.headers.get('last-modified')
  ? new Date(listResponse.headers.get('last-modified') as string)
      .toISOString()
      .slice(0, 10)
  : new Date().toISOString().slice(0, 10);

await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, 'tranco-top.csv'),
  `${lines.join('\n')}\n`,
);
await writeFile(
  path.join(outputDir, 'tranco-source.json'),
  `${JSON.stringify(
    {
      name: 'Tranco',
      listId,
      listUrl: `https://tranco-list.eu/list/${listId}/full`,
      listDate,
      description:
        'A reproducible research ranking of popular domains; used as a popularity proxy, not direct traffic measurement.',
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Saved ${lines.length.toLocaleString()} ranked domains from Tranco list ${listId}.`,
);
