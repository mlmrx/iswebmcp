import { adoptionReports, latestAdoptionReport } from '@/lib/adoption';
import {
  compareDirectoryWithCensus,
  webMcpDirectory,
  webMcpDirectoryHistory,
} from '@/lib/adoption-directory';
import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  const ecosystemComparison = compareDirectoryWithCensus(
    webMcpDirectory,
    latestAdoptionReport.census?.detections ?? [],
  );
  return Response.json(
    {
      schema: 'https://iswebmcp.com/adoption/schema/v1',
      generated_at: latestAdoptionReport.generatedAt,
      latest_report: latestAdoptionReport,
      ecosystem_index: {
        generated_at: webMcpDirectory.generatedAt,
        source: webMcpDirectory.source,
        summary: webMcpDirectory.summary,
        digest: webMcpDirectory.digest,
        history: webMcpDirectoryHistory,
        independent_census_comparison: ecosystemComparison,
        url: `${siteOrigin}/adoption/ecosystem.json`,
      },
      archive: adoptionReports.map((report) => ({
        date: report.date,
        title: report.title,
        url: `${siteOrigin}/adoption/${report.date}`,
        json_url: `${siteOrigin}/adoption/${report.date}/report.json`,
        change_summary: report.changeSummary,
      })),
      citation_policy:
        'Cite the dated report URL and the finding source URL. Preserve evidenceLevel, attribution, and limitations when summarizing.',
    },
    {
      headers: {
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
}
