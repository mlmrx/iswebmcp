import directoryData from '@/content/adoption/ecosystem-index.json';

export type DirectorySiteType = 'live' | 'demo';
export type DirectoryToolKind = 'answer' | 'act' | 'transact';
export type DirectoryToolImplementation = 'imperative' | 'declarative';

export interface DirectoryTool {
  name: string;
  kind: DirectoryToolKind;
  implementation: DirectoryToolImplementation;
}

export interface DirectorySite {
  host: string;
  url: string;
  type: DirectorySiteType;
  category: string;
  summary: string;
  apiSurface: string;
  toolCount: number;
  tools: DirectoryTool[];
}

export interface DirectoryAggregate {
  label: string;
  count: number;
}

export interface WebMcpDirectorySnapshot {
  schemaVersion: 1;
  generatedAt: string;
  sourceGeneratedAt: string;
  digest: string;
  source: {
    name: 'webmcp.com Directory API';
    sitesUrl: string;
    statsUrl: string;
    methodologyUrl: string;
    apiDocsUrl: string;
    evidenceLevel: 'third-party-indexed';
  };
  summary: {
    directorySites: number;
    liveSites: number;
    demoSites: number;
    indexedTools: number;
    answerTools: number;
    actionTools: number;
    transactionTools: number;
    imperativeTools: number;
    declarativeTools: number;
    shopifyStores: number;
    reportedTotalSites: number;
    additiveReconciliationGap: number;
  };
  aggregates: {
    categories: DirectoryAggregate[];
    apiSurfaces: DirectoryAggregate[];
  };
  caveats: string[];
  sites: DirectorySite[];
}

export const webMcpDirectory = directoryData as WebMcpDirectorySnapshot;

export interface DirectorySearchOptions {
  query?: string;
  type?: DirectorySiteType;
  category?: string;
  kind?: DirectoryToolKind;
  limit?: number;
}

export function searchWebMcpDirectory(
  options: DirectorySearchOptions = {},
): DirectorySite[] {
  const normalized = options.query?.trim().toLowerCase();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  return webMcpDirectory.sites
    .filter((site) => {
      if (options.type && site.type !== options.type) return false;
      if (options.category && site.category !== options.category) return false;
      if (
        options.kind &&
        !site.tools.some((tool) => tool.kind === options.kind)
      )
        return false;
      if (!normalized) return true;
      return [
        site.host,
        site.category,
        site.summary,
        site.apiSurface,
        ...site.tools.map((tool) => tool.name),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    })
    .sort(
      (left, right) =>
        right.toolCount - left.toolCount || left.host.localeCompare(right.host),
    )
    .slice(0, limit);
}

export function validateWebMcpDirectorySnapshot(
  snapshot: WebMcpDirectorySnapshot,
): string[] {
  const errors: string[] = [];
  const toolCount = snapshot.sites.reduce(
    (total, site) => total + site.tools.length,
    0,
  );
  if (snapshot.sites.length !== snapshot.summary.directorySites) {
    errors.push('Directory site count does not match retained records.');
  }
  if (
    snapshot.summary.liveSites + snapshot.summary.demoSites !==
    snapshot.summary.directorySites
  ) {
    errors.push('Live and demo counts do not reconcile to directory sites.');
  }
  if (toolCount !== snapshot.summary.indexedTools) {
    errors.push('Indexed tool count does not match retained tool records.');
  }
  if (
    snapshot.summary.answerTools +
      snapshot.summary.actionTools +
      snapshot.summary.transactionTools !==
    snapshot.summary.indexedTools
  ) {
    errors.push('Tool-kind counts do not reconcile to indexed tools.');
  }
  return errors;
}
