import { describe, expect, it } from 'vitest';

import {
  adoptionReportMarkdown,
  adoptionReports,
  getAdoptionReport,
  latestAdoptionReport,
} from '@/lib/adoption';

describe('WebMCP adoption reports', () => {
  it('keeps the archive newest-first with stable dated lookup', () => {
    expect(adoptionReports.length).toBeGreaterThan(0);
    expect(adoptionReports[0]).toBe(latestAdoptionReport);
    expect(getAdoptionReport(latestAdoptionReport.date)).toBe(
      latestAdoptionReport,
    );
    expect(getAdoptionReport('1900-01-01')).toBeUndefined();
    expect(adoptionReports.map((report) => report.date)).toEqual(
      adoptionReports
        .map((report) => report.date)
        .sort((a, b) => b.localeCompare(a)),
    );
  });

  it('reconciles published summary counts with the evidence ledger', () => {
    const report = latestAdoptionReport;
    expect(report.summary.organizationsNamed).toBe(report.findings.length);
    expect(report.summary.namedToolDefinitions).toBe(
      report.findings.reduce(
        (total, finding) => total + finding.tools.length,
        0,
      ),
    );
    expect(report.summary.providerEngineeredDeployments).toBeLessThan(
      report.summary.thirdPartyObservedDeployments,
    );
    expect(report.summary.platformInheritedDeployments).toBe(72);
  });

  it('requires sources and explicit limitations for every organization', () => {
    for (const finding of latestAdoptionReport.findings) {
      expect(finding.sources.length, finding.organization).toBeGreaterThan(0);
      expect(finding.limitations.length, finding.organization).toBeGreaterThan(
        0,
      );
      expect(finding.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      for (const source of finding.sources) {
        expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('does not claim runtime verification without runtime evidence', () => {
    const runtimeFindings = latestAdoptionReport.findings.filter(
      (finding) => finding.evidenceLevel === 'runtime-verified',
    );
    expect(runtimeFindings).toHaveLength(0);
    expect(latestAdoptionReport.analysis.at(-1)?.body).toContain(
      'does not upgrade source evidence into runtime verification',
    );
  });

  it('renders a citation-ready markdown version', () => {
    const markdown = adoptionReportMarkdown(latestAdoptionReport);
    expect(markdown).toContain(`# ${latestAdoptionReport.title}`);
    expect(markdown).toContain('## Methodology');
    expect(markdown).toContain('## Cloudflare');
    expect(markdown).toContain('`render.docs.search`');
    expect(markdown).toContain('https://blog.cloudflare.com/webmcp/');
  });
});
