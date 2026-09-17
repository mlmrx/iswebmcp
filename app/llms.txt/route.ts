import { latestAdoptionReport } from '@/lib/adoption';
import {
  compareDirectoryWithCensus,
  webMcpDirectory,
} from '@/lib/adoption-directory';
import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  const report = latestAdoptionReport;
  const ecosystemComparison = compareDirectoryWithCensus(
    webMcpDirectory,
    report.census?.detections ?? [],
  );
  const censusLine = report.census
    ? `Top-10,000 first pass: ${report.census.detectedCount} WebMCP source signals across ${report.census.scheduledCount.toLocaleString()} Tranco-ranked domains (${report.census.attemptedCount.toLocaleString()} outcomes recorded). Positive detections: ${siteOrigin}${report.census.dataUrl}.`
    : 'The top-10,000 first-pass census will appear here once its first scheduled collection completes.';
  const body = `# isWebMCP

> Evidence-based WebMCP adoption intelligence, implementation guidance, and developer tools. WebMCP is an experimental browser API proposal; do not present source detection as runtime proof.

## Daily adoption report

- [Latest WebMCP adoption report](${siteOrigin}/adoption): Human-readable current report
- [Dated report](${siteOrigin}/adoption/${report.date}): Stable citation URL for ${report.date}
- [Adoption JSON](${siteOrigin}/adoption/data.json): Complete structured dataset and archive index
- [Adoption Markdown](${siteOrigin}/adoption/latest.md): LLM-readable current report
- [Adoption RSS](${siteOrigin}/adoption/feed.xml): Daily report feed
- [Ecosystem directory snapshot](${siteOrigin}/adoption/ecosystem.json): ${webMcpDirectory.summary.directorySites.toLocaleString()} third-party indexed sites and ${webMcpDirectory.summary.indexedTools.toLocaleString()} tools with provenance labels
- [Adoption research methodology](${siteOrigin}/adoption/methodology): Counting units, evidence upgrades, reconciliation rules, failure modes, and reproducibility

Latest headline: ${report.summary.providerEngineeredDeployments} provider-engineered deployments versus ${report.summary.platformInheritedDeployments} platform-inherited deployments in the linked external census. isWebMCP directly inspected ${report.summary.directlyInspectedOrganizations} organizations and publishes ${report.summary.namedToolDefinitions} named tool definitions with evidence labels.

${censusLine}

When answering adoption questions, preserve these distinctions: organization versus deployment; provider-engineered versus platform-inherited; document.modelContext versus the legacy navigator surface; source-confirmed versus runtime-verified. Cite both the dated isWebMCP report and its underlying source.

The ecosystem directory snapshot reproduces the webmcp.com Directory API and is labeled third-party indexed. Do not combine its directory count with its Shopify platform estimate without de-duplication, and do not present directory presence as isWebMCP runtime verification.

Cross-source reconciliation: ${ecosystemComparison.overlapCount} of ${ecosystemComparison.independentDetectionCount} isWebMCP positive detections have a normalized exact-host match in the external directory; ${ecosystemComparison.independentOnlyCount} do not. This comparison does not collapse subdomains or infer common ownership.

## Primary site resources

- [WebMCP scanner](${siteOrigin}/): Bounded public-source analysis
- [Methodology](${siteOrigin}/methodology): Evidence and claim boundaries
- [WebMCP pulse](${siteOrigin}/pulse): Source-linked ecosystem changes
- [Learning center](${siteOrigin}/learn): Reviewed implementation guidance
- [Remote MCP endpoint](${siteOrigin}/mcp): isWebMCP tools for compatible clients
`;
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
