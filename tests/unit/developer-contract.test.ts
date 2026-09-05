import { describe, expect, it } from 'vitest';
import { analyzeSource } from '@/lib/scanner';
import { summarizeReport } from '@/lib/integrations/report-summary';
import {
  compare,
  validateSummary,
} from '../../integrations/developer-kit/index.mjs';

function summary(html: string) {
  return summarizeReport(
    analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html,
      status: 200,
      contentType: 'text/html',
      bytesRead: html.length,
      redirects: 0,
    }),
  );
}

describe('developer toolkit against the real report producer', () => {
  it('accepts an API summary and detects a lost accessible name', () => {
    const baseline = summary(
      '<main><h1>Search</h1><label for="q">Search</label><input id="q"></main>',
    );
    const current = summary('<main><h1>Search</h1><input id="q"></main>');
    expect(validateSummary(baseline)).toBe(baseline);
    expect(baseline.summarySchemaVersion).toBe('iswebmcp-summary/v1');
    expect(baseline.actionability.modelVersion).toBe(
      'source-actionability-v2.1',
    );
    expect(compare(baseline, current)).toMatchObject({
      regressed: true,
      evidenceScope: 'source-only',
    });
    expect(current.labels).toMatchObject({
      runtime: 'unknown',
      lift: 'withheld',
    });
  });
  it('cannot turn an incompatible model into a passing CI check', () => {
    const baseline = summary('<main><h1>Search</h1></main>');
    const current = structuredClone(baseline);
    current.actionability.modelVersion = 'future-model';
    expect(() => compare(baseline, current)).toThrow(/model version/);
  });
});
