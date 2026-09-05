export type EvidenceSource =
  | 'source'
  | 'runtime'
  | 'imported'
  | 'measured'
  | 'inferred';

export type Confidence = 'high' | 'medium' | 'low';

export type FindingStatus =
  | 'pass'
  | 'partial'
  | 'fail'
  | 'not_observed'
  | 'not_applicable';

export type ImplementationState =
  | 'not_detected'
  | 'source_hint_detected'
  | 'runtime_verified'
  | 'journey_tested'
  | 'improvement_proven';

export interface Evidence {
  id: string;
  source: EvidenceSource;
  category: string;
  summary: string;
  detail: string;
  location?: string;
  confidence: Confidence;
  observedAt: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  title: string;
  status: FindingStatus;
  severity: 'blocker' | 'high' | 'medium' | 'low' | 'info';
  evidenceIds: string[];
  whyItMatters: string;
  recommendation: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface ActionCandidate {
  id: string;
  name: string;
  purpose: string;
  sourceEvidenceIds: string[];
  humanUiAvailable: boolean;
  agentUiConfidence: Confidence;
  webmcpStatus: 'unknown' | 'missing' | 'imported' | 'verified' | 'withheld';
  risk: 'read' | 'reversible_write' | 'consequential_write';
}

export interface ScoreCategory {
  id: string;
  label: string;
  weight: number;
  score: number | null;
  status: FindingStatus;
  explanation: string;
  metrics?: ScoreMetric[];
}

export interface ScoreMetric {
  id: string;
  label: string;
  observed: boolean;
  value: string;
  points: number;
  possible: number;
  rationale: string;
}

export interface WeightedScore {
  value: number | null;
  coverage: number;
  interval?: {
    lower: number;
    upper: number;
  };
  categories: ScoreCategory[];
  modelVersion?: string;
  confidence?: Confidence;
  coverageNote?: string;
}

export interface ScanCounts {
  forms: number;
  inputs: number;
  buttons: number;
  links: number;
  selects: number;
  textareas: number;
  labels: number;
  structuredData: number;
  headings: number;
}

export interface ImportedToolDefinition {
  name: string;
  title?: string;
  description: string;
  originalDescriptionLength: number;
  inputSchema: ImportedSchemaSummary;
  outputSchema: ImportedSchemaSummary;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  declaresStateEffects: boolean;
  declaresVerification: boolean;
  declaresConfirmation: boolean;
  declaredErrorCodeCount: number;
  matchedActionIds: string[];
}

export interface ImportedSchemaSummary {
  present: boolean;
  rootType?: string;
  propertiesObject: boolean;
  closed: boolean;
  propertyNames: string[];
  required: string[];
  requiredIsValidSubset: boolean;
  typedPropertyCount: number;
  constrainedPropertyCount: number;
  sensitivePropertyNames: string[];
  depth: number;
  nodeCount: number;
}

export interface ImportedManifestAudit {
  id: string;
  source: 'imported';
  evidenceMode: 'imported';
  independentlyVerified: false;
  format: 'iswebmcp-tool-manifest/v1';
  captureMethod: 'manual' | 'same_origin_probe';
  sourceReportId: string;
  targetOrigin: string;
  capturedAt?: string;
  importedAt: string;
  tools: ImportedToolDefinition[];
  quality: WeightedScore;
  evidence: Evidence[];
  findings: Finding[];
  matchedActionIds: string[];
  limitations: string[];
}

export interface ScanReport {
  id: string;
  /** Captured before report URL redaction; absent on older stored reports. */
  comparisonContext?: {
    version: 'source-input/v1';
    fingerprint: string;
  };
  parentReportId?: string;
  reportKind: 'observed_source' | 'synthetic_fixture';
  normalizedUrl: string;
  finalUrl: string;
  goal?: string;
  status: 'complete';
  scannedAt: string;
  response: {
    status: number;
    contentType: string;
    bytesRead: number;
    declaredBytes?: number;
    analysisLimitBytes?: number;
    redirects: number;
    truncated: boolean;
  };
  implementationState: ImplementationState;
  baselineActionability: WeightedScore;
  webmcpQuality: WeightedScore | null;
  webmcpLift: null;
  importedProof?: ImportedManifestAudit;
  counts: ScanCounts;
  evidence: Evidence[];
  findings: Finding[];
  actionSurface: ActionCandidate[];
  limitations: string[];
  strongestEvidence: string[];
  recommendations: Array<{
    priority: 'P0' | 'P1' | 'P2';
    title: string;
    detail: string;
  }>;
}

export interface ScanErrorBody {
  error: {
    code:
      | 'INVALID_INPUT'
      | 'UNSAFE_TARGET'
      | 'UNSUPPORTED_CONTENT'
      | 'UPSTREAM_TIMEOUT'
      | 'UPSTREAM_FAILURE'
      | 'RESPONSE_TOO_LARGE'
      | 'RATE_LIMITED';
    message: string;
  };
}

export interface DemoProduct {
  id: string;
  name: string;
  maker: string;
  price: number;
  rating: number;
  reviews: number;
  batteryHours: number;
  features: Array<
    'noise_canceling' | 'multipoint' | 'spatial_audio' | 'foldable'
  >;
  summary: string;
  color: string;
}

export interface JourneyEvent {
  id: string;
  atMs: number;
  kind: 'ui' | 'tool' | 'state' | 'rejected' | 'assertion' | 'human';
  taskStep?: 'search' | 'compare' | 'cart' | 'verify';
  label: string;
  detail: string;
}

export interface JourneyAssertion {
  id: string;
  label: string;
  passed: boolean;
  evidence: string;
}

export interface JourneyRun {
  id: string;
  mode: 'baseline' | 'webmcp';
  path: 'none' | 'ui_only' | 'tool_only' | 'mixed';
  comparisonId: string;
  fixtureVersion: 'headset-v1';
  taskId: 'headset_research';
  evidenceMode: 'interactive' | 'controlled_replay';
  startedAt: string;
  completedAt?: string;
  success: boolean;
  elapsedMs: number;
  uiActionCount: number;
  webmcpCallCount: number;
  invalidAttemptCount: number;
  humanInterventionCount: number;
  assertions: JourneyAssertion[];
  events: JourneyEvent[];
}

export interface LiftComponent {
  id: string;
  label: string;
  weight: number;
  value: number | null;
  contribution: number | null;
  comparable: boolean;
}

export interface LiftResult {
  value: number | null;
  interpretation: string;
  components: LiftComponent[];
  baseline: JourneyRun;
  webmcp: JourneyRun;
  limitation: string;
}

export interface ToolAuditCheck {
  id: string;
  title: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  detail: string;
  standard: 'draft' | 'chrome_guidance' | 'project_rule';
}

export interface ToolAuditResult {
  conformance: number;
  security: number;
  lifecycle: number;
  detectedNames: string[];
  checks: ToolAuditCheck[];
  boilerplate: string;
}
