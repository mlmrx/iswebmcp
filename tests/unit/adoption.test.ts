import { describe, expect, it } from 'vitest';

import {
  adoptionReportMarkdown,
  adoptionReports,
  getAdoptionReport,
  latestAdoptionReport,
} from '@/lib/adoption';
import { detectWebMcpSource } from '@/lib/adoption-census';

describe('WebMCP adoption reports', () => {
  it('detects current, legacy, and bridge source signals without treating prose as adoption', () => {
    const current = detectWebMcpSource(
      `<script>document.modelContext.registerTool({name: 'search_docs'})</script>`,
    );
    expect(current).toMatchObject({
      detected: true,
      surface: 'document',
      signals: ['document.modelContext', 'registerTool'],
      tools: ['search_docs'],
    });

    const legacy = detectWebMcpSource(
      `<script>navigator.modelContext.registerTool({name: 'legacy_search'})</script>`,
    );
    expect(legacy.surface).toBe('navigator');
    expect(legacy.tools).toEqual(['legacy_search']);

    expect(
      detectWebMcpSource('<p>WebMCP is an experimental proposal.</p>'),
    ).toMatchObject({
      detected: false,
      tools: [],
    });
  });

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

  it('publishes the dated top-10,000 census alongside the evidence ledger', () => {
    const census = latestAdoptionReport.census;
    expect(census?.scope).toBe('tranco-top-10000');
    expect(census?.scheduledCount).toBe(10_000);
    expect(census?.attemptedCount).toBe(10_000);
    expect(census?.detectedCount).toBeGreaterThan(0);
    expect(census?.dataUrl).toBe(
      `/data/adoption-census/${latestAdoptionReport.date}.json`,
    );
    expect(census?.auditDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(census?.detections.length).toBe(census?.detectedCount);
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
