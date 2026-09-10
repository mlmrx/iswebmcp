import { adoptionReportMarkdown, latestAdoptionReport } from '@/lib/adoption';
import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  const body = `${adoptionReportMarkdown(latestAdoptionReport)}

## Citation guidance

Canonical report: ${siteOrigin}/adoption/${latestAdoptionReport.date}
Structured data: ${siteOrigin}/adoption/${latestAdoptionReport.date}/report.json

Preserve the report date, evidence level, attribution, surface status, and limitations. Link the underlying source beside any claim about a named organization. Do not convert source-confirmed findings into runtime-verified claims.
`;
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
