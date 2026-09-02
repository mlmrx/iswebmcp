import { describe, expect, it } from 'vitest';

import { makeDemoReport } from '@/lib/scanner';
import {
  applyCrawlAudit,
  opportunityBand,
  opportunityFromReport,
  rowFromReport,
  summarizeSnapshot,
  type CrawlAuditManifest,
  type WebIndexRow,
} from '@/lib/web-index';

const source = {
  name: 'Tranco' as const,
  listId: 'TEST',
  listUrl: 'https://tranco-list.eu/list/TEST/full',
  listDate: '2026-08-31',
  description: 'test fixture',
};

const audit: CrawlAuditManifest = {
  version: 'crawl-audit-v1',
  auditedAt: '2026-09-02T05:14:55.667Z',
  scheduledCount: 4,
  validAttemptCount: 2,
  collectionErrorCount: 2,
  expectedRawState: 'unreachable',
  expectedRawErrorCode: 'UPSTREAM_FAILURE',
  collectionErrorRanges: [
    {
      startRank: 2,
      endRank: 3,
      rowCount: 2,
      observedFrom: '2026-09-01T11:39:22.103Z',
      observedThrough: '2026-09-01T11:39:22.203Z',
      reason: 'Test-only contiguous collection failure.',
    },
  ],
  note: 'Test fixture.',
};

const rawRows: WebIndexRow[] = [
  {
    popularityRank: 1,
    domain: 'one.example',
    state: 'scored',
    scannedAt: '2026-09-01T00:00:00.000Z',
    durationMs: 100,
    opportunityScore: 50,
    opportunityBand: 'strong_candidate',
  },
  {
    popularityRank: 2,
    domain: 'two.example',
    state: 'unreachable',
    scannedAt: '2026-09-01T00:00:01.000Z',
    durationMs: 100,
    errorCode: 'UPSTREAM_FAILURE',
  },
  {
    popularityRank: 3,
    domain: 'three.example',
    state: 'unreachable',
    scannedAt: '2026-09-01T00:00:02.000Z',
    durationMs: 100,
    errorCode: 'UPSTREAM_FAILURE',
  },
  {
    popularityRank: 4,
    domain: 'four.example',
    state: 'unreachable',
    scannedAt: '2026-09-01T00:00:03.000Z',
    durationMs: 100,
    errorCode: 'UPSTREAM_FAILURE',
  },
];

describe('web readiness index', () => {
  it('uses stable opportunity bands', () => {
    expect(opportunityBand(70)).toBe('high_leverage');
    expect(opportunityBand(45)).toBe('strong_candidate');
    expect(opportunityBand(20)).toBe('foundation');
    expect(opportunityBand(19)).toBe('low_interaction');
  });

  it('derives a bounded opportunity score from observed evidence', () => {
    const result = opportunityFromReport(makeDemoReport());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('keeps source popularity rank separate from our opportunity rank', () => {
    const report = makeDemoReport();
    const row = rowFromReport(17, 'example.com', report, 123);
    const snapshot = summarizeSnapshot(
      [row],
      source,
      '2026-08-31T00:00:00.000Z',
    );
    expect(snapshot.rows[0].popularityRank).toBe(17);
    expect(snapshot.coverage.scored).toBe(1);
    expect(snapshot.targetCount).toBe(100_000);
    expect(snapshot.rows[0].opportunityRank).toBe(1);
    expect(snapshot.publishedRowCount).toBe(1);
  });

  it('assigns equal scores the same dense rank instead of fake precision', () => {
    const rows: WebIndexRow[] = [
      { ...rawRows[0], popularityRank: 90, opportunityScore: 60 },
      {
        ...rawRows[0],
        popularityRank: 2,
        domain: 'tie.example',
        opportunityScore: 60,
      },
      {
        ...rawRows[0],
        popularityRank: 1,
        domain: 'lower.example',
        opportunityScore: 40,
      },
    ];
    const snapshot = summarizeSnapshot(rows, source);
    expect(snapshot.rows.map((row) => row.opportunityRank)).toEqual([1, 1, 2]);
  });

  it('preserves raw rows while publishing audited collection errors separately', () => {
    const rows = applyCrawlAudit(rawRows, audit);
    const snapshot = summarizeSnapshot(
      rows,
      source,
      '2026-09-02T05:15:00.000Z',
      audit,
    );

    expect(rawRows.map((row) => row.state)).toEqual([
      'scored',
      'unreachable',
      'unreachable',
      'unreachable',
    ]);
    expect(rows.map((row) => row.state)).toEqual([
      'scored',
      'collection_error',
      'collection_error',
      'unreachable',
    ]);
    expect(snapshot).toMatchObject({
      status: 'audited_partial',
      scheduledCount: 4,
      attemptedCount: 4,
      validAttemptCount: 2,
      collectionErrorCount: 2,
      coverage: {
        scored: 1,
        unreachable: 1,
        collection_error: 2,
      },
      audit: { version: 'crawl-audit-v1' },
    });
  });

  it('rejects duplicate ranks, duplicate domains, and audit evidence mismatches', () => {
    const duplicateRank = rawRows.map((row) => ({ ...row }));
    duplicateRank[3].popularityRank = 3;
    expect(() => applyCrawlAudit(duplicateRank, audit)).toThrow(
      /duplicate rank 3/,
    );

    const duplicateDomain = rawRows.map((row) => ({ ...row }));
    duplicateDomain[3].domain = 'ONE.EXAMPLE';
    expect(() => applyCrawlAudit(duplicateDomain, audit)).toThrow(
      /duplicate domain one\.example/,
    );

    const mismatchedEvidence = rawRows.map((row) => ({ ...row }));
    mismatchedEvidence[1].errorCode = 'UPSTREAM_TIMEOUT';
    expect(() => applyCrawlAudit(mismatchedEvidence, audit)).toThrow(
      /audited rank 2 expected UPSTREAM_FAILURE/,
    );
  });
});
