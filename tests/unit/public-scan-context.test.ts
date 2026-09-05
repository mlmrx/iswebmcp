import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  fetchPublicText: vi.fn(),
  putReport: vi.fn(),
}));
vi.mock('@/lib/network', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/network')>()),
  fetchPublicText: mocked.fetchPublicText,
}));
vi.mock('@/lib/scan-store', () => ({
  acquireScanSlot: () => () => {},
  allowRequest: () => true,
  putReport: mocked.putReport,
}));
vi.mock('@/lib/url-attempt-store', () => ({
  beginUrlAttempt: async () => null,
  completeUrlAttempt: async () => {},
}));

import { runPublicSourceScan } from '@/lib/integrations/public-scan';
import { summarizeReport } from '@/lib/integrations/report-summary';
import { sourceComparisonContext } from '@/lib/integrations/comparison-context';
import { compare } from '../../integrations/developer-kit/index.mjs';

const html =
  '<main><h1>Search</h1><label for="q">Search</label><input id="q"></main>';

describe('source comparison provenance before URL redaction', () => {
  beforeEach(() => {
    mocked.putReport.mockClear();
    mocked.fetchPublicText.mockReset().mockResolvedValue({
      finalUrl: 'https://example.com/result?view=stable',
      text: html,
      status: 200,
      contentType: 'text/html',
      bytesRead: Buffer.byteLength(html),
      truncated: false,
      redirects: 1,
    });
  });

  it('captures actual requested query before redaction, using the real scanner and producer', async () => {
    const first = await runPublicSourceScan({
      url: 'https://example.com/?view=one',
      goal: 'Find products',
    });
    const second = await runPublicSourceScan({
      url: 'https://example.com/?view=two',
      goal: 'Find products',
    });
    expect(first.normalizedUrl).toBe(second.normalizedUrl);
    expect(first.finalUrl).toBe('https://example.com/result');
    expect(first.comparisonContext).not.toEqual(second.comparisonContext);
    expect(JSON.stringify(first.comparisonContext)).not.toMatch(
      /view=|Find products/,
    );
    expect(mocked.putReport).toHaveBeenCalledWith(first);
    expect(() =>
      compare(summarizeReport(first), summarizeReport(second)),
    ).toThrow(/input context/);
  });

  it('captures redirected queries and rejects different effective destinations', async () => {
    const first = await runPublicSourceScan({ url: 'https://example.com/' });
    mocked.fetchPublicText.mockResolvedValueOnce({
      finalUrl: 'https://example.com/result?view=other',
      text: html,
      status: 200,
      contentType: 'text/html',
      bytesRead: Buffer.byteLength(html),
      truncated: false,
      redirects: 1,
    });
    const second = await runPublicSourceScan({ url: 'https://example.com/' });
    expect(first.finalUrl).toBe(second.finalUrl);
    expect(() =>
      compare(summarizeReport(first), summarizeReport(second)),
    ).toThrow(/input context/);
  });

  it('permits repeated identical inputs and detects an actual source regression', async () => {
    const first = await runPublicSourceScan({
      url: 'https://example.com/',
      goal: 'Find products',
    });
    const repeat = await runPublicSourceScan({
      url: 'https://example.com/',
      goal: 'Find products',
    });
    expect(
      compare(summarizeReport(first), summarizeReport(repeat)).regressed,
    ).toBe(false);
    mocked.fetchPublicText.mockResolvedValueOnce({
      finalUrl: 'https://example.com/result?view=stable',
      text: '<main><h1>Search</h1><input id="q"></main>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 42,
      truncated: false,
      redirects: 1,
    });
    const worse = await runPublicSourceScan({
      url: 'https://example.com/',
      goal: 'Find products',
    });
    const diff = compare(summarizeReport(first), summarizeReport(worse));
    expect(diff.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'UI_ACCESSIBLE_NAMES',
          regressed: true,
          regressionReasons: ['new-problem'],
        }),
      ]),
    );
  });

  it('fingerprints analysis bounds and preserves duplicate query parameter ordering', () => {
    const input = {
      requestedUrl: 'https://example.com/?x=1&x=2',
      finalUrl: 'https://example.com/',
      analysisLimitBytes: 1000,
    };
    expect(sourceComparisonContext(input)).not.toEqual(
      sourceComparisonContext({ ...input, analysisLimitBytes: 2000 }),
    );
    expect(sourceComparisonContext(input)).not.toEqual(
      sourceComparisonContext({
        ...input,
        requestedUrl: 'https://example.com/?x=2&x=1',
      }),
    );
    expect(sourceComparisonContext(input)).toEqual(
      sourceComparisonContext({
        ...input,
        finalUrl: 'https://example.com/#fragment',
        goal: ' ',
      }),
    );
  });
});
