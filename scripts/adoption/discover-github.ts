import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const token = process.env.GITHUB_TOKEN;
const outputPath = path.join(
  process.cwd(),
  'content',
  'adoption',
  'candidates.json',
);

if (!token) {
  console.log(
    'GITHUB_TOKEN unavailable; preserving the existing candidate queue.',
  );
  process.exit(0);
}

const queries = [
  '"document.modelContext.registerTool" in:file',
  '"navigator.modelContext.registerTool" in:file',
  '".webmcp/bridge.js" in:file',
];
const candidates = new Map<
  string,
  { repository: string; path: string; url: string; query: string }
>();

for (const query of queries) {
  const response = await fetch(
    `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=50`,
    {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'user-agent': 'isWebMCP-Adoption-Research/1.0',
        'x-github-api-version': '2022-11-28',
      },
    },
  );
  if (!response.ok) {
    console.warn(`GitHub discovery query failed with HTTP ${response.status}.`);
    continue;
  }
  const body = (await response.json()) as {
    items?: Array<{
      repository: { full_name: string };
      path: string;
      html_url: string;
    }>;
  };
  for (const item of body.items ?? []) {
    if (item.repository.full_name.toLowerCase() === 'mlmrx/iswebmcp') continue;
    candidates.set(item.html_url, {
      repository: item.repository.full_name,
      path: item.path,
      url: item.html_url,
      query,
    });
  }
}

const previous = await readFile(outputPath, 'utf8')
  .then((value) => JSON.parse(value) as { candidates?: unknown[] })
  .catch(() => ({ candidates: [] }));
const payload = {
  generatedAt: new Date().toISOString(),
  policy:
    'Unpublished discovery leads only. A repository match is not a deployment and is never promoted without first-party page or runtime evidence.',
  previousCandidateCount: previous.candidates?.length ?? 0,
  candidateCount: candidates.size,
  candidates: [...candidates.values()].sort((a, b) =>
    `${a.repository}/${a.path}`.localeCompare(`${b.repository}/${b.path}`),
  ),
};
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(
  `Queued ${candidates.size} GitHub source candidates for editorial verification.`,
);
