import type { ScanErrorBody, ScanReport } from '@/lib/types';

export const INDEX_TARGET_COUNT = 100_000;
export const INDEX_VERSION = 'wri-v1';

export type IndexState =
  | 'scored'
  | 'robots_blocked'
  | 'unreachable'
  | 'unsupported'
  | 'unsafe'
  | 'collection_error';

export interface CrawlAuditRange {
  startRank: number;
  endRank: number;
  rowCount: number;
  observedFrom: string;
  observedThrough: string;
  reason: string;
}

export interface CrawlAuditManifest {
  version: 'crawl-audit-v1';
  auditedAt: string;
  scheduledCount: number;
  validAttemptCount: number;
  collectionErrorCount: number;
  expectedRawState: Exclude<IndexState, 'collection_error'>;
  expectedRawErrorCode: ScanErrorBody['error']['code'];
  collectionErrorRanges: CrawlAuditRange[];
  note: string;
}

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
  status: 'pilot' | 'in_progress' | 'complete' | 'audited_partial';
  title: string;
  generatedAt: string;
  targetCount: number;
  scheduledCount: number;
  attemptedCount: number;
  validAttemptCount: number;
  collectionErrorCount: number;
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
  audit?: CrawlAuditManifest;
  rows: WebIndexRow[];
}

const rawIndexStates = new Set<IndexState>([
  'scored',
  'robots_blocked',
  'unreachable',
  'unsupported',
  'unsafe',
]);

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid WebMCP index corpus: ${message}`);
}

function validateAuditManifest(audit: CrawlAuditManifest): void {
  invariant(audit.version === 'crawl-audit-v1', 'unsupported audit version');
  invariant(
    Number.isInteger(audit.scheduledCount) && audit.scheduledCount > 0,
    'scheduledCount must be a positive integer',
  );
  invariant(
    Number.isFinite(Date.parse(audit.auditedAt)),
    'auditedAt must be an ISO timestamp',
  );
  invariant(
    rawIndexStates.has(audit.expectedRawState),
    'expectedRawState must be a raw crawl state',
  );
  invariant(
    audit.validAttemptCount + audit.collectionErrorCount ===
      audit.scheduledCount,
    'valid and collection-error counts must equal scheduledCount',
  );

  let previousEnd = 0;
  let auditedRows = 0;
  for (const range of audit.collectionErrorRanges) {
    invariant(
      Number.isInteger(range.startRank) && Number.isInteger(range.endRank),
      'audit range ranks must be integers',
    );
    invariant(
      range.startRank > previousEnd && range.endRank >= range.startRank,
      'audit ranges must be ordered and non-overlapping',
    );
    invariant(
      range.endRank <= audit.scheduledCount,
      'audit range exceeds scheduledCount',
    );
    invariant(
      range.rowCount === range.endRank - range.startRank + 1,
      'audit range rowCount does not match its inclusive bounds',
    );
    invariant(
      Number.isFinite(Date.parse(range.observedFrom)) &&
        Number.isFinite(Date.parse(range.observedThrough)),
      'audit range timestamps must be valid',
    );
    invariant(Boolean(range.reason.trim()), 'audit range reason is required');
    previousEnd = range.endRank;
    auditedRows += range.rowCount;
  }
  invariant(
    auditedRows === audit.collectionErrorCount,
    'audit ranges do not equal collectionErrorCount',
  );
}

export function validateRawIndexCorpus(
  rows: WebIndexRow[],
  audit: CrawlAuditManifest,
): void {
  validateAuditManifest(audit);
  invariant(
    rows.length === audit.scheduledCount,
    `expected ${audit.scheduledCount} raw rows, received ${rows.length}`,
  );

  const byRank = new Map<number, WebIndexRow>();
  const domains = new Set<string>();
  for (const row of rows) {
    invariant(
      Number.isInteger(row.popularityRank) &&
        row.popularityRank >= 1 &&
        row.popularityRank <= audit.scheduledCount,
      `rank ${row.popularityRank} is outside the scheduled corpus`,
    );
    invariant(
      !byRank.has(row.popularityRank),
      `duplicate rank ${row.popularityRank}`,
    );
    invariant(
      rawIndexStates.has(row.state),
      `rank ${row.popularityRank} contains a derived state in raw data`,
    );
    const domain = row.domain.trim().toLowerCase();
    invariant(Boolean(domain), `rank ${row.popularityRank} has no domain`);
    invariant(!domains.has(domain), `duplicate domain ${domain}`);
    domains.add(domain);
    byRank.set(row.popularityRank, row);
  }

  for (let rank = 1; rank <= audit.scheduledCount; rank += 1) {
    invariant(byRank.has(rank), `missing contiguous rank ${rank}`);
  }
  for (const range of audit.collectionErrorRanges) {
    for (let rank = range.startRank; rank <= range.endRank; rank += 1) {
      const row = byRank.get(rank) as WebIndexRow;
      invariant(
        row.state === audit.expectedRawState,
        `audited rank ${rank} expected raw state ${audit.expectedRawState}, received ${row.state}`,
      );
      invariant(
        row.errorCode === audit.expectedRawErrorCode,
        `audited rank ${rank} expected ${audit.expectedRawErrorCode}, received ${row.errorCode ?? 'no error code'}`,
      );
    }
  }
}

export function applyCrawlAudit(
  rawRows: WebIndexRow[],
  audit: CrawlAuditManifest,
): WebIndexRow[] {
  validateRawIndexCorpus(rawRows, audit);
  const ranges = audit.collectionErrorRanges;
  return rawRows
    .map((row) => {
      const isCollectionError = ranges.some(
        (range) =>
          row.popularityRank >= range.startRank &&
          row.popularityRank <= range.endRank,
      );
      return isCollectionError
        ? { ...row, state: 'collection_error' as const }
        : { ...row };
    })
    .sort((left, right) => left.popularityRank - right.popularityRank);
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
  audit?: CrawlAuditManifest,
): WebIndexSnapshot {
  const coverage: WebIndexSnapshot['coverage'] = {
    scored: 0,
    robots_blocked: 0,
    unreachable: 0,
    unsupported: 0,
    unsafe: 0,
    collection_error: 0,
  };
  for (const row of rows) coverage[row.state] += 1;
  if (audit) {
    invariant(
      rows.length === audit.scheduledCount,
      'audited snapshot row count does not equal scheduledCount',
    );
    invariant(
      coverage.collection_error === audit.collectionErrorCount,
      'derived collection-error coverage does not match the audit',
    );
  } else {
    invariant(
      coverage.collection_error === 0,
      'collection-error rows require audit metadata',
    );
  }
  const scheduledCount = audit?.scheduledCount ?? INDEX_TARGET_COUNT;
  const collectionErrorCount = coverage.collection_error;
  const validAttemptCount = rows.length - collectionErrorCount;
  if (audit) {
    invariant(
      validAttemptCount === audit.validAttemptCount,
      'derived valid-attempt count does not match the audit',
    );
  }
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
  let previousScore: number | undefined;
  for (const row of rankedRows) {
    if (row.state === 'scored') {
      if (row.opportunityScore !== previousScore) {
        opportunityRank += 1;
        previousScore = row.opportunityScore;
      }
      row.opportunityRank = opportunityRank;
    }
  }
  return {
    version: INDEX_VERSION,
    status:
      audit && collectionErrorCount > 0
        ? 'audited_partial'
        : rows.length >= scheduledCount
          ? 'complete'
          : 'pilot',
    title: 'WebMCP Readiness Index',
    generatedAt,
    targetCount: scheduledCount,
    scheduledCount,
    attemptedCount: rows.length,
    validAttemptCount,
    collectionErrorCount,
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
    audit,
    rows: rankedRows,
  };
}

export function displayBand(band: OpportunityBand): string {
  return band.replaceAll('_', ' ');
}
