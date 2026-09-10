import { adoptionReports, latestAdoptionReport } from '@/lib/adoption';
import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  return Response.json(
    {
      schema: 'https://iswebmcp.com/adoption/schema/v1',
      generated_at: latestAdoptionReport.generatedAt,
      latest_report: latestAdoptionReport,
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
