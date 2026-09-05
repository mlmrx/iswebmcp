export declare const DEFAULT_ENDPOINT: 'https://iswebmcp.com/api/integrations/scan';
export declare const SUMMARY_SCHEMA_VERSION: 'iswebmcp-summary/v2';
export type FindingStatus =
  | 'pass'
  | 'partial'
  | 'fail'
  | 'not_observed'
  | 'not_applicable';
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'blocker';
export interface SourceFinding {
  /** Required in v2. Older scan summaries remain readable but cannot be compared. */
  ruleId?: string;
  title: string;
  status: FindingStatus;
  severity: Severity;
  recommendation: string;
}
export interface SourceSummary {
  summarySchemaVersion?: string;
  comparisonContext?: {
    version: 'source-input/v1';
    fingerprint: string;
  } | null;
  findingsCoverage?: {
    status: 'complete' | 'partial';
    total: number;
    returned: number;
  };
  reportId: string;
  reportKind: 'observed_source';
  url: string;
  scannedAt: string;
  evidenceScope: 'source-only';
  implementationState: string;
  collection: {
    status: 'complete' | 'partial';
    analyzedBytes: number;
    declaredBytes: number | null;
    truncated: boolean;
  };
  actionability: {
    value: number | null;
    coverage: number;
    confidence: string;
    interval: { lower: number; upper: number } | null;
    modelVersion?: string | null;
  };
  counts: Record<string, number>;
  actions: Array<{
    name: string;
    purpose: string;
    risk: string;
    agentUiConfidence: string;
    webmcpStatus: string;
  }>;
  findings: SourceFinding[];
  recommendations: Array<{ priority: string; title: string; detail: string }>;
  limitations: string[];
  labels: { runtime: 'unknown'; lift: 'withheld'; contract: string };
}
export interface ScanOptions {
  goal?: string;
  /** False by default: strips query before transmission to the service. */
  includeQuery?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** An explicitly chosen HTTPS scan service. The CLI always uses iswebmcp.com. */
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
}
export interface SourceComparison {
  schemaVersion: 'iswebmcp-source-comparison/v2';
  evidenceScope: 'source-only';
  baselineReportId: string;
  currentReportId: string;
  url: string;
  modelVersion: string;
  regressed: boolean;
  regressionCount: number;
  changes: Array<{
    ruleId: string;
    title: string;
    before: { status: FindingStatus; severity: Severity } | null;
    after: { status: FindingStatus; severity: Severity };
    regressed: boolean;
    regressionReasons: Array<
      'new-problem' | 'status-worsened' | 'severity-increased'
    >;
    recommendation: string;
  }>;
  noLongerReported: string[];
  limitations: string[];
}
export declare class IsWebMCPError extends Error {
  code: string;
  status?: number;
  retryAfter?: string;
  constructor(
    code: string,
    message: string,
    details?: { status?: number; retryAfter?: string },
  );
}
export declare function normalizeTarget(
  input: string,
  options?: { includeQuery?: boolean },
): string;
export declare function validateSummary(value: unknown): SourceSummary;
export declare function scan(
  url: string,
  options?: ScanOptions,
): Promise<SourceSummary>;
export declare function compare(
  baseline: SourceSummary,
  current: SourceSummary,
): SourceComparison;
