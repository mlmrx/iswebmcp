import type { ScanReport } from '@/lib/types';

export interface IntegrationReportSummary extends Record<string, unknown> {
  summarySchemaVersion: 'iswebmcp-summary/v1';
  reportId: string;
  reportKind: ScanReport['reportKind'];
  url: string;
  scannedAt: string;
  evidenceScope: 'source-only' | 'synthetic-fixture';
  implementationState: ScanReport['implementationState'];
  collection: {
    status: 'complete' | 'partial';
    analyzedBytes: number;
    declaredBytes: number | null;
    truncated: boolean;
  };
  actionability: {
    modelVersion: string | null;
    value: number | null;
    coverage: number;
    confidence: string;
    interval: { lower: number; upper: number } | null;
  };
  counts: ScanReport['counts'];
  actions: Array<{
    name: string;
    purpose: string;
    risk: string;
    agentUiConfidence: string;
    webmcpStatus: string;
  }>;
  findings: Array<{
    title: string;
    status: string;
    severity: string;
    recommendation: string;
  }>;
  recommendations: ScanReport['recommendations'];
  limitations: string[];
  labels: {
    runtime: 'unknown';
    lift: 'withheld';
    contract: 'not-provided' | 'imported-not-independently-verified';
  };
}

export function summarizeReport(report: ScanReport): IntegrationReportSummary {
  return {
    summarySchemaVersion: 'iswebmcp-summary/v1',
    reportId: report.id,
    reportKind: report.reportKind,
    url: report.finalUrl,
    scannedAt: report.scannedAt,
    evidenceScope:
      report.reportKind === 'synthetic_fixture'
        ? 'synthetic-fixture'
        : 'source-only',
    implementationState: report.implementationState,
    collection: {
      status: report.response.truncated ? 'partial' : 'complete',
      analyzedBytes: report.response.bytesRead,
      declaredBytes: report.response.declaredBytes ?? null,
      truncated: report.response.truncated,
    },
    actionability: {
      modelVersion: report.baselineActionability.modelVersion ?? null,
      value: report.baselineActionability.value,
      coverage: report.baselineActionability.coverage,
      confidence: report.baselineActionability.confidence ?? 'low',
      interval: report.baselineActionability.interval ?? null,
    },
    counts: report.counts,
    actions: report.actionSurface.slice(0, 12).map((action) => ({
      name: action.name,
      purpose: action.purpose,
      risk: action.risk,
      agentUiConfidence: action.agentUiConfidence,
      webmcpStatus: action.webmcpStatus,
    })),
    findings: report.findings.slice(0, 12).map((finding) => ({
      title: finding.title,
      status: finding.status,
      severity: finding.severity,
      recommendation: finding.recommendation,
    })),
    recommendations: report.recommendations.slice(0, 8),
    limitations: report.limitations,
    labels: {
      runtime: 'unknown',
      lift: 'withheld',
      contract: report.importedProof
        ? 'imported-not-independently-verified'
        : 'not-provided',
    },
  };
}
