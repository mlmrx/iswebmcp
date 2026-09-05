import { describe, expect, it } from 'vitest';
import { analyzeSource, makeDemoReport } from '@/lib/scanner';
import {
  baselineExportBlocker,
  buildReportOverview,
} from '@/lib/report-overview';
import { sourceComparisonContext } from '@/lib/integrations/comparison-context';
import { summarizeReport } from '@/lib/integrations/report-summary';
import {
  compare,
  validateSummary,
} from '../../integrations/developer-kit/index.mjs';

function report(html = '<main><h1>Search</h1><input></main>') {
  return {
    ...analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html,
      status: 200,
      contentType: 'text/html',
      bytesRead: html.length,
      redirects: 0,
    }),
    comparisonContext: sourceComparisonContext({
      requestedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      analysisLimitBytes: 1_000_000,
    }),
  };
}

describe('first useful report takeaway', () => {
  it('leads with source-backed problems, never missing runtime evidence', () => {
    const overview = buildReportOverview(report());
    expect(overview.headline).toMatch(/source-level issue/);
    expect(overview.issues.map((item) => item.ruleId)).toContain(
      'UI_ACCESSIBLE_NAMES',
    );
    expect(overview.issues.map((item) => item.ruleId)).not.toContain(
      'EVIDENCE_RUNTIME_BOUNDARY',
    );
    expect(overview.nextStep).toBe(overview.issues[0]?.recommendation);
  });
  it('does not turn unavailable runtime proof into a source defect', () => {
    const value = report(
      '<main><h1>Search</h1><label for="q">Search</label><input id="q"></main>',
    );
    const overview = buildReportOverview(value);
    expect(overview.issues).toHaveLength(0);
    expect(overview.actions.every((action) => action.humanUiAvailable)).toBe(
      true,
    );
    expect(overview.nextStep).toMatch(
      /cannot establish task success|may be absent/,
    );
  });
  it('labels incomplete collection ahead of findings', () => {
    const value = report();
    value.response.truncated = true;
    expect(buildReportOverview(value).headline).toMatch(/Only part/);
    expect(baselineExportBlocker(value)).toMatch(/Partial/);
  });
  it('exports the exact toolkit summary contract, with comparable provenance', () => {
    const value = report();
    expect(baselineExportBlocker(value)).toBeNull();
    const exported = JSON.parse(JSON.stringify(summarizeReport(value)));
    expect(validateSummary(exported)).toBe(exported);
    expect(compare(exported, exported)).toMatchObject({ regressed: false });
  });
  it('blocks synthetic, legacy, and imported baselines', () => {
    expect(baselineExportBlocker(makeDemoReport())).toMatch(/illustrative/);
    const value = report();
    expect(
      baselineExportBlocker({ ...value, comparisonContext: undefined }),
    ).toMatch(/older/);
    expect(
      baselineExportBlocker({
        ...value,
        importedProof: {} as NonNullable<typeof value.importedProof>,
      }),
    ).toMatch(/imported contracts/);
  });
});
