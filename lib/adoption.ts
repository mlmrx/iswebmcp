import adoptionData from '@/content/adoption/index.json';

import type {
  AdoptionCensusDetection,
  AdoptionCensusSource,
} from '@/lib/adoption-census';

export type AdoptionEvidenceLevel =
  | 'runtime-verified'
  | 'source-confirmed'
  | 'third-party-observed'
  | 'announced';

export type AdoptionSurfaceStatus = 'current' | 'legacy' | 'mixed' | 'unknown';

export interface AdoptionTool {
  name: string;
  purpose: string;
  kind: 'read' | 'write' | 'consequential' | 'unknown';
  status: AdoptionEvidenceLevel;
}

export interface AdoptionSource {
  name: string;
  url: string;
  type: 'live-source' | 'first-party' | 'third-party';
  supports: string;
}

export interface AdoptionFinding {
  slug: string;
  organization: string;
  category: string;
  implementation: string;
  attribution: 'provider-engineered' | 'platform-inherited';
  evidenceLevel: AdoptionEvidenceLevel;
  surface: string;
  surfaceStatus: AdoptionSurfaceStatus;
  deploymentCount: number;
  deploymentCountBasis: string;
  summary: string;
  observedAt: string;
  pages: string[];
  tools: AdoptionTool[];
  sources: AdoptionSource[];
  limitations: string[];
}

export interface AdoptionReport {
  schemaVersion: number;
  date: string;
  generatedAt: string;
  title: string;
  dek: string;
  status: 'draft' | 'published';
  changeSummary: string;
  previousReportDate: string | null;
  summary: {
    organizationsNamed: number;
    directlyInspectedOrganizations: number;
    namedToolDefinitions: number;
    thirdPartyObservedDeployments: number;
    platformInheritedDeployments: number;
    providerEngineeredDeployments: number;
    legacyOnlyDeployments: number;
  };
  census?: {
    scope: 'tranco-top-10000';
    generatedAt: string;
    source: AdoptionCensusSource;
    scheduledCount: number;
    attemptedCount: number;
    detectedCount: number;
    notDetectedCount: number;
    robotsBlockedCount: number;
    unreachableCount: number;
    unsupportedCount: number;
    documentSurfaceCount: number;
    navigatorSurfaceCount: number;
    bridgeSurfaceCount: number;
    namedToolDefinitions: number;
    auditDigest: string;
    dataUrl: string;
    detections: AdoptionCensusDetection[];
  };
  analysis: Array<{ heading: string; body: string }>;
  findings: AdoptionFinding[];
  methodology: {
    scope: string;
    unitPolicy: string;
    evidenceLevels: Array<{
      level: AdoptionEvidenceLevel;
      definition: string;
    }>;
    collectionNotes: string[];
  };
}

const reports = adoptionData as AdoptionReport[];

export const adoptionReports = [...reports]
  .filter((report) => report.status === 'published')
  .sort((a, b) => b.date.localeCompare(a.date));

export const latestAdoptionReport = adoptionReports[0];

export function getAdoptionReport(date: string): AdoptionReport | undefined {
  return adoptionReports.find((report) => report.date === date);
}

export function formatAdoptionDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(`${date}T12:00:00-07:00`));
}

export function adoptionReportMarkdown(report: AdoptionReport): string {
  const findings = report.findings
    .map((finding) => {
      const tools = finding.tools.length
        ? finding.tools
            .map((tool) => `- \`${tool.name}\` — ${tool.purpose}`)
            .join('\n')
        : '- Exact tool inventory not yet independently verified.';
      const sources = finding.sources
        .map(
          (source) => `- [${source.name}](${source.url}) — ${source.supports}`,
        )
        .join('\n');
      return `## ${finding.organization}\n\nEvidence: ${finding.evidenceLevel}; attribution: ${finding.attribution}; API surface: ${finding.surface} (${finding.surfaceStatus}).\n\n${finding.summary}\n\n### Tools\n\n${tools}\n\n### Sources\n\n${sources}\n\nLimitations: ${finding.limitations.join(' ')}`;
    })
    .join('\n\n');

  const census = report.census
    ? `## Tranco top-10,000 first-pass coverage\n\n- ${report.census.scheduledCount.toLocaleString()} domains scheduled\n- ${report.census.attemptedCount.toLocaleString()} collection outcomes recorded\n- ${report.census.detectedCount.toLocaleString()} domains with a WebMCP source signal\n- ${report.census.notDetectedCount.toLocaleString()} domains without a detected signal\n- ${report.census.robotsBlockedCount.toLocaleString()} domains blocked by robots policy\n- ${report.census.unreachableCount.toLocaleString()} domains unreachable or timed out\n- ${report.census.namedToolDefinitions.toLocaleString()} tool names recovered from positive source matches\n\nSource list: [Tranco ${report.census.source.listId}](${report.census.source.listUrl}) (${report.census.source.listDate}). [Download the positive-detection ledger](${report.census.dataUrl}). The audit digest is \`${report.census.auditDigest}\`.\n\nThe scan is source-only: a detected signal is not proof that a browser exposed or successfully invoked the tool.`
    : '';

  return `# ${report.title}\n\nPublished: ${report.date}\nGenerated: ${report.generatedAt}\n\n${report.dek}\n\n## Headline numbers\n\n- ${report.summary.organizationsNamed} named organizations\n- ${report.summary.directlyInspectedOrganizations} directly inspected organizations\n- ${report.summary.namedToolDefinitions} named tool definitions in the evidence ledger\n- ${report.summary.thirdPartyObservedDeployments} deployments in the linked external census\n- ${report.summary.platformInheritedDeployments} platform-inherited deployments\n- ${report.summary.providerEngineeredDeployments} provider-engineered deployments in that census\n- ${report.summary.legacyOnlyDeployments} legacy-only deployments in that census\n\n${census}\n\n## What changed\n\n${report.changeSummary}\n\n## Analysis\n\n${report.analysis.map((item) => `### ${item.heading}\n\n${item.body}`).join('\n\n')}\n\n${findings}\n\n## Methodology\n\n${report.methodology.scope}\n\n${report.methodology.unitPolicy}\n\n${report.methodology.collectionNotes.map((note) => `- ${note}`).join('\n')}\n`;
}
