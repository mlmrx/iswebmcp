import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  DirectoryAggregate,
  DirectorySite,
  DirectorySiteType,
  DirectoryTool,
  DirectoryToolImplementation,
  DirectoryToolKind,
  WebMcpDirectorySnapshot,
} from '../../lib/adoption-directory';

const API_ORIGIN = 'https://webmcp.com';
const PAGE_LIMIT = 500;
const USER_AGENT =
  'isWebMCP-Adoption-Research/1.0 (+https://iswebmcp.com/adoption; research@iswebmcp.com)';

interface SourceTool {
  name: string;
  kind: string;
  impl: string;
}

interface SourceSite {
  host: string;
  url: string;
  type: string;
  category?: string;
  desc?: string;
  apiSurface?: string;
  toolCount: number;
  tools: SourceTool[];
}

interface SitesResponse {
  ok: boolean;
  generatedAt: string;
  total: number;
  count: number;
  sites: SourceSite[];
}

interface StatsResponse {
  ok: boolean;
  generatedAt: string;
  platforms: { shopify?: number };
  totalSites: number;
  sites: number;
  liveSites: number;
  demoSites: number;
  tools: number;
  byKind: { answer?: number; act?: number; transact?: number };
  byImpl: { imperative?: number; declarative?: number };
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`${url} returned HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTool(tool: SourceTool): DirectoryTool {
  const kinds = new Set(['answer', 'act', 'transact']);
  const implementations = new Set(['imperative', 'declarative']);
  if (!kinds.has(tool.kind)) throw new Error(`Unknown tool kind: ${tool.kind}`);
  if (!implementations.has(tool.impl))
    throw new Error(`Unknown tool implementation: ${tool.impl}`);
  return {
    name: tool.name,
    kind: tool.kind as DirectoryToolKind,
    implementation: tool.impl as DirectoryToolImplementation,
  };
}

function normalizeSite(site: SourceSite): DirectorySite {
  if (site.type !== 'live' && site.type !== 'demo') {
    throw new Error(`Unknown site type for ${site.host}: ${site.type}`);
  }
  const tools = site.tools.map(normalizeTool);
  if (site.toolCount !== tools.length) {
    throw new Error(`Tool count mismatch for ${site.host}.`);
  }
  return {
    host: site.host,
    url: site.url,
    type: site.type as DirectorySiteType,
    category: site.category?.trim() || 'Uncategorized',
    summary: (site.desc ?? '').trim().slice(0, 280),
    apiSurface: site.apiSurface?.trim() || 'unknown',
    toolCount: site.toolCount,
    tools,
  };
}

function aggregate(values: string[]): DirectoryAggregate[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    );
}

const stats = await getJson<StatsResponse>(`${API_ORIGIN}/api/v1/stats`);
if (!stats.ok) throw new Error('Directory stats API did not return ok=true.');

const sourceSites: SourceSite[] = [];
let sourceGeneratedAt = stats.generatedAt;
for (let offset = 0; offset < stats.sites; offset += PAGE_LIMIT) {
  const page = await getJson<SitesResponse>(
    `${API_ORIGIN}/api/v1/sites?fields=minimal&limit=${PAGE_LIMIT}&offset=${offset}`,
  );
  if (!page.ok)
    throw new Error(`Directory page ${offset} did not return ok=true.`);
  if (page.total !== stats.sites)
    throw new Error(
      `Directory total changed during sync: ${stats.sites} to ${page.total}.`,
    );
  sourceGeneratedAt = page.generatedAt;
  sourceSites.push(...page.sites);
}

const sites = sourceSites
  .map(normalizeSite)
  .sort((left, right) => left.host.localeCompare(right.host));
if (sites.length !== stats.sites) {
  throw new Error(
    `Expected ${stats.sites} directory sites; received ${sites.length}.`,
  );
}
const retainedTools = sites.reduce(
  (total, site) => total + site.tools.length,
  0,
);
if (retainedTools !== stats.tools) {
  throw new Error(`Expected ${stats.tools} tools; retained ${retainedTools}.`);
}

const shopifyStores = stats.platforms.shopify ?? 0;
const normalizedPayload = JSON.stringify(sites);
const digest = createHash('sha256').update(normalizedPayload).digest('hex');
const snapshot: WebMcpDirectorySnapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt,
  digest,
  source: {
    name: 'webmcp.com Directory API',
    sitesUrl: `${API_ORIGIN}/api/v1/sites`,
    statsUrl: `${API_ORIGIN}/api/v1/stats`,
    methodologyUrl: `${API_ORIGIN}/methodology`,
    apiDocsUrl: `${API_ORIGIN}/api-docs`,
    evidenceLevel: 'third-party-indexed',
  },
  summary: {
    directorySites: stats.sites,
    liveSites: stats.liveSites,
    demoSites: stats.demoSites,
    indexedTools: stats.tools,
    answerTools: stats.byKind.answer ?? 0,
    actionTools: stats.byKind.act ?? 0,
    transactionTools: stats.byKind.transact ?? 0,
    imperativeTools: stats.byImpl.imperative ?? 0,
    declarativeTools: stats.byImpl.declarative ?? 0,
    shopifyStores,
    reportedTotalSites: stats.totalSites,
    additiveReconciliationGap: stats.totalSites - stats.sites - shopifyStores,
  },
  aggregates: {
    categories: aggregate(sites.map((site) => site.category)),
    apiSurfaces: aggregate(sites.map((site) => site.apiSurface)),
  },
  caveats: [
    'These records reproduce a third-party index; isWebMCP has not independently inspected every listed site.',
    'Directory presence is not runtime verification and does not establish successful tool invocation.',
    'The reported platform and directory counts are preserved as separate units and are not added without de-duplication.',
    'Tool descriptions and input schemas remain available from the source API; this snapshot retains names and classifications for compact analysis.',
  ],
  sites,
};

const outputPath = path.join(
  process.cwd(),
  'content',
  'adoption',
  'ecosystem-index.json',
);
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(
  `Synced ${sites.length} directory sites and ${retainedTools} tools (${digest.slice(0, 12)}).`,
);
