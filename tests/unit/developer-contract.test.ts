import { describe, expect, it } from 'vitest';
import { analyzeSource } from '@/lib/scanner';
import { summarizeReport } from '@/lib/integrations/report-summary';
import { sourceComparisonContext } from '@/lib/integrations/comparison-context';
import {
  compare,
  validateSummary,
} from '../../integrations/developer-kit/index.mjs';

function summary(html: string, goal?: string, url = 'https://example.com/') {
  return summarizeReport({
    ...analyzeSource({
      normalizedUrl: url,
      finalUrl: url,
      goal,
      html,
      status: 200,
      contentType: 'text/html',
      bytesRead: html.length,
      redirects: 0,
    }),
    comparisonContext: sourceComparisonContext({
      requestedUrl: url,
      finalUrl: url,
      goal,
      analysisLimitBytes: 1_000_000,
    }),
  });
}

describe('developer toolkit against the real report producer', () => {
  it('accepts an API summary and detects a lost accessible name', () => {
    const baseline = summary(
      '<main><h1>Search</h1><label for="q">Search</label><input id="q"></main>',
    );
    const current = summary('<main><h1>Search</h1><input id="q"></main>');
    expect(validateSummary(baseline)).toBe(baseline);
    expect(baseline.summarySchemaVersion).toBe('iswebmcp-summary/v2');
    expect(baseline.actionability.modelVersion).toBe(
      'source-actionability-v2.2',
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
  it('holds goal and query inputs constant without exposing raw context values', () => {
    const html = '<main><h1>Search</h1><input></main>';
    const baseline = summary(
      html,
      'Find products',
      'https://example.com/?view=one',
    );
    const current = summary(
      html,
      'Find products',
      'https://example.com/?view=two',
    );
    expect(baseline.url).toBe('https://example.com/');
    expect(JSON.stringify(baseline.comparisonContext)).not.toMatch(
      /Find products|view=one/,
    );
    expect(() => compare(baseline, current)).toThrow(/input context/);
    expect(() =>
      compare(
        baseline,
        summary(html, 'Find support', 'https://example.com/?view=one'),
      ),
    ).toThrow(/input context/);
    expect(
      compare(
        baseline,
        summary(html, '  Find products  ', 'https://example.com/?view=one'),
      ),
    ).toMatchObject({ regressed: false });
  });
  it('does not manufacture input provenance for an older report', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<main>Hello</main>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 18,
      redirects: 0,
    });
    const legacy = summarizeReport(report);
    expect(legacy.comparisonContext).toBeNull();
    expect(() => compare(legacy, legacy)).toThrow(/input context/);
  });
  it('returns the entire finding inventory even when the report exceeds the former display cap', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<main>Hello</main>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 18,
      redirects: 0,
    });
    report.findings = Array.from({ length: 15 }, (_, index) => ({
      ...report.findings[0]!,
      id: `finding-${index}`,
      ruleId: `rule-${index}`,
    }));
    const result = summarizeReport(report);
    expect(result.findings).toHaveLength(15);
    expect(result.findings[14]?.ruleId).toBe('rule-14');
    expect(result.findingsCoverage).toEqual({
      status: 'complete',
      total: 15,
      returned: 15,
    });
    expect(validateSummary(result)).toBe(result);
  });
});
