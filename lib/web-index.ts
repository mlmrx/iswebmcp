import type { ScanErrorBody, ScanReport } from '@/lib/types';

export const INDEX_TARGET_COUNT = 100_000;
export const INDEX_VERSION = 'wri-v1';

export type IndexState =
  | 'scored'
  | 'robots_blocked'
  | 'unreachable'
  | 'unsupported'
  | 'unsafe';

export interface WebIndexRow {
  opportunityRank?: number;
  popularityRank: number;
  domain: string;
  state: IndexState;
  scannedAt: string;
  durationMs: number;
  finalUrl?: string;
  baselineScore?: number;
  evidenceCoverage?: number;
  opportunityScore?: number;
  opportunityBand?: OpportunityBand;
  forms?: number;
  controls?: number;
  actionCandidates?: number;
  structuredData?: number;
  webmcpSourceHint?: boolean;
  bytesRead?: number;
  redirects?: number;
  errorCode?: ScanErrorBody['error']['code'];
}

export type OpportunityBand =
  | 'high_leverage'
  | 'strong_candidate'
  | 'foundation'
  | 'low_interaction';

export interface WebIndexSnapshot {
  version: typeof INDEX_VERSION;
  status: 'pilot' | 'in_progress' | 'complete';
  title: string;
  generatedAt: string;
  targetCount: number;
  attemptedCount: number;
  scoredCount: number;
  publishedRowCount: number;
  source: {
    name: 'Tranco';
    listId: string;
    listUrl: string;
    listDate: string;
    description: string;
  };
  methodology: {
    pageScope: string;
    evidenceScope: string;
    robotsPolicy: string;
    afterPolicy: string;
  };
  coverage: Record<IndexState, number>;
  distribution: Array<{ band: OpportunityBand; count: number }>;
  rows: WebIndexRow[];
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function opportunityFromReport(report: ScanReport): {
  score: number;
  band: OpportunityBand;
} {
  const controls =
    report.counts.inputs +
    report.counts.buttons +
    report.counts.selects +
    report.counts.textareas;
  const workflowSignal = clamp(
    report.actionSurface.length * 13 + report.counts.forms * 10 + controls * 2,
  );
  const baseline = report.baselineActionability.value ?? 0;
  const friction = 100 - baseline;
  const implementationGap =
    report.implementationState === 'not_detected' ? 100 : 35;
  const score = Math.round(
    workflowSignal * 0.55 + friction * 0.35 + implementationGap * 0.1,
  );
  return { score, band: opportunityBand(score) };
}

export function opportunityBand(score: number): OpportunityBand {
  if (score >= 70) return 'high_leverage';
  if (score >= 45) return 'strong_candidate';
  if (score >= 20) return 'foundation';
  return 'low_interaction';
}

export function rowFromReport(
  popularityRank: number,
  domain: string,
  report: ScanReport,
  durationMs: number,
): WebIndexRow {
  const opportunity = opportunityFromReport(report);
  return {
    popularityRank,
    domain,
    state: 'scored',
    scannedAt: report.scannedAt,
    durationMs,
    finalUrl: report.finalUrl,
    baselineScore: report.baselineActionability.value ?? undefined,
    evidenceCoverage: report.baselineActionability.coverage,
    opportunityScore: opportunity.score,
    opportunityBand: opportunity.band,
    forms: report.counts.forms,
    controls:
      report.counts.inputs +
      report.counts.buttons +
      report.counts.selects +
      report.counts.textareas,
    actionCandidates: report.actionSurface.length,
    structuredData: report.counts.structuredData,
    webmcpSourceHint: report.implementationState !== 'not_detected',
    bytesRead: report.response.bytesRead,
    redirects: report.response.redirects,
  };
}

export function summarizeSnapshot(
  rows: WebIndexRow[],
  source: WebIndexSnapshot['source'],
  generatedAt = new Date().toISOString(),
): WebIndexSnapshot {
  const coverage: WebIndexSnapshot['coverage'] = {
    scored: 0,
    robots_blocked: 0,
    unreachable: 0,
    unsupported: 0,
    unsafe: 0,
  };
  for (const row of rows) coverage[row.state] += 1;
  const bands: OpportunityBand[] = [
    'high_leverage',
    'strong_candidate',
    'foundation',
    'low_interaction',
  ];
  const rankedRows = [...rows].sort(
    (a, b) =>
      (b.opportunityScore ?? -1) - (a.opportunityScore ?? -1) ||
      a.popularityRank - b.popularityRank,
  );
  let opportunityRank = 0;
  for (const row of rankedRows) {
    if (row.state === 'scored') {
      opportunityRank += 1;
      row.opportunityRank = opportunityRank;
    }
  }
  return {
    version: INDEX_VERSION,
    status: rows.length >= INDEX_TARGET_COUNT ? 'complete' : 'pilot',
    title: 'WebMCP Readiness Index',
    generatedAt,
    targetCount: INDEX_TARGET_COUNT,
    attemptedCount: rows.length,
    scoredCount: coverage.scored,
    publishedRowCount: rankedRows.length,
    source,
    methodology: {
      pageScope: 'One public homepage per ranked domain.',
      evidenceScope:
        'Static response source only; no JavaScript execution, login, cookies, or screenshots.',
      robotsPolicy:
        'The research crawler checks robots.txt before fetching a homepage and records exclusions.',
      afterPolicy:
        'After-state visuals are illustrative design targets, never measured outcomes for third-party sites.',
    },
    coverage,
    distribution: bands.map((band) => ({
      band,
      count: rows.filter((row) => row.opportunityBand === band).length,
    })),
    rows: rankedRows,
  };
}

export function displayBand(band: OpportunityBand): string {
  return band.replaceAll('_', ' ');
}
