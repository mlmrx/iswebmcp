export const ADOPTION_CENSUS_LIMIT = 10_000;

export type AdoptionCensusRowState =
  | 'detected'
  | 'not-detected'
  | 'robots-blocked'
  | 'unreachable'
  | 'unsupported';

export type AdoptionCensusSurface =
  | 'document'
  | 'navigator'
  | 'bridge'
  | 'mixed'
  | 'unknown';

export interface AdoptionCensusDetection {
  popularityRank: number;
  domain: string;
  url: string;
  finalUrl?: string;
  state: 'detected';
  surface: AdoptionCensusSurface;
  signals: string[];
  tools: string[];
  checkedAt: string;
  bytesRead?: number;
  redirects?: number;
}

export interface AdoptionCensusRow {
  popularityRank: number;
  domain: string;
  url: string;
  finalUrl?: string;
  state: AdoptionCensusRowState;
  surface?: AdoptionCensusSurface;
  signals?: string[];
  tools?: string[];
  checkedAt: string;
  bytesRead?: number;
  redirects?: number;
  errorCode?: string;
}

export interface AdoptionCensusSource {
  name: 'Tranco';
  listId: string;
  listUrl: string;
  listDate: string;
  description: string;
}

export interface AdoptionCensusCoverage {
  scheduledCount: number;
  attemptedCount: number;
  detectedCount: number;
  notDetectedCount: number;
  robotsBlockedCount: number;
  unreachableCount: number;
  unsupportedCount: number;
  documentSurfaceCount: number;
  navigatorSurfaceCount: number;
  bridgeSurfaceCount: number;
  namedToolDefinitions: number;
}

export interface AdoptionCensus {
  schemaVersion: 1;
  generatedAt: string;
  scope: 'tranco-top-10000';
  source: AdoptionCensusSource;
  coverage: AdoptionCensusCoverage;
  auditDigest: string;
  rowPolicy: string;
  detections: AdoptionCensusDetection[];
}

const TOOL_NAME = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function extractScriptSource(source: string): string {
  return Array.from(
    source
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
  )
    .filter(
      (match) => !/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1]),
    )
    .map((match) => match[2])
    .join('\n');
}

function extractToolNames(scriptSource: string, source: string): string[] {
  const names: string[] = [];
  for (const match of scriptSource.matchAll(/registerTool\s*\(/gi)) {
    const window = scriptSource.slice(match.index, (match.index ?? 0) + 4_000);
    for (const name of window.matchAll(
      /\bname\s*:\s*["'`]([^"'`]{1,128})["'`]/g,
    )) {
      if (TOOL_NAME.test(name[1])) names.push(name[1]);
    }
  }

  // Some bridge manifests are serialized as markup attributes rather than a
  // literal registerTool call. Only retain names from a WebMCP-labelled
  // attribute so ordinary page metadata is not mistaken for a tool.
  for (const match of source.matchAll(
    /\b(?:toolname|tool-name)\s*=\s*["']([^"']{1,128})["']/gi,
  )) {
    if (TOOL_NAME.test(match[1])) names.push(match[1]);
  }
  return unique(names).slice(0, 50);
}

export function detectWebMcpSource(source: string): {
  detected: boolean;
  surface: AdoptionCensusSurface;
  signals: string[];
  tools: string[];
} {
  const scriptSource = extractScriptSource(source);
  const documentSurface = /\bdocument\s*\.\s*modelContext\b/i.test(
    scriptSource,
  );
  const navigatorSurface = /\bnavigator\s*\.\s*modelContext\b/i.test(
    scriptSource,
  );
  const registerTool = /\bregisterTool\s*\(/i.test(scriptSource);
  const bridgeAsset =
    /<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["'][^"']*webmcp[^"']*["']/i.test(
      source,
    ) || /(?:webmcp[\w./-]*bridge|bridge[\w./-]*webmcp)/i.test(scriptSource);
  const labelledBridge = /\bdata-webmcp(?:[=\s]|-)/i.test(source);
  const signals = [
    documentSurface ? 'document.modelContext' : undefined,
    navigatorSurface ? 'navigator.modelContext' : undefined,
    registerTool ? 'registerTool' : undefined,
    bridgeAsset || labelledBridge
      ? 'WebMCP bridge or manifest marker'
      : undefined,
  ].filter((value): value is string => Boolean(value));
  const detected =
    documentSurface ||
    navigatorSurface ||
    (registerTool && /\b(?:modelContext|webmcp)\b/i.test(scriptSource)) ||
    bridgeAsset ||
    labelledBridge;
  const surfaces = [
    documentSurface ? 'document' : undefined,
    navigatorSurface ? 'navigator' : undefined,
    bridgeAsset || labelledBridge ? 'bridge' : undefined,
  ].filter((value): value is AdoptionCensusSurface => Boolean(value));
  const surface = !surfaces.length
    ? 'unknown'
    : surfaces.length === 1
      ? surfaces[0]
      : 'mixed';
  return {
    detected,
    surface,
    signals: unique(signals),
    tools: detected ? extractToolNames(scriptSource, source) : [],
  };
}

export function summarizeAdoptionCensusRows(
  rows: AdoptionCensusRow[],
  scheduledCount = rows.length,
): AdoptionCensusCoverage {
  const count = (state: AdoptionCensusRowState) =>
    rows.filter((row) => row.state === state).length;
  const detections = rows.filter((row) => row.state === 'detected');
  return {
    scheduledCount,
    attemptedCount: rows.length,
    detectedCount: detections.length,
    notDetectedCount: count('not-detected'),
    robotsBlockedCount: count('robots-blocked'),
    unreachableCount: count('unreachable'),
    unsupportedCount: count('unsupported'),
    documentSurfaceCount: detections.filter(
      (row) => row.surface === 'document' || row.surface === 'mixed',
    ).length,
    navigatorSurfaceCount: detections.filter(
      (row) => row.surface === 'navigator' || row.surface === 'mixed',
    ).length,
    bridgeSurfaceCount: detections.filter(
      (row) => row.surface === 'bridge' || row.surface === 'mixed',
    ).length,
    namedToolDefinitions: detections.reduce(
      (total, row) => total + (row.tools?.length ?? 0),
      0,
    ),
  };
}
