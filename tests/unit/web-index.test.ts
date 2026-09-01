import { describe, expect, it } from 'vitest';

import { makeDemoReport } from '@/lib/scanner';
import {
  opportunityBand,
  opportunityFromReport,
  rowFromReport,
  summarizeSnapshot,
} from '@/lib/web-index';

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
      {
        name: 'Tranco',
        listId: 'TEST',
        listUrl: 'https://tranco-list.eu/list/TEST/full',
        listDate: '2026-08-31',
        description: 'test fixture',
      },
      '2026-08-31T00:00:00.000Z',
    );
    expect(snapshot.rows[0].popularityRank).toBe(17);
    expect(snapshot.coverage.scored).toBe(1);
    expect(snapshot.targetCount).toBe(100_000);
    expect(snapshot.rows[0].opportunityRank).toBe(1);
    expect(snapshot.publishedRowCount).toBe(1);
  });
});
