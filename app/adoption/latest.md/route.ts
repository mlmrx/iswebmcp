import { adoptionReportMarkdown, latestAdoptionReport } from '@/lib/adoption';

export function GET() {
  return new Response(adoptionReportMarkdown(latestAdoptionReport), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
