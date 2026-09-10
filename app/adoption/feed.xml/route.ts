import { adoptionReports } from '@/lib/adoption';
import { siteOrigin } from '@/lib/site-origin';

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const latest = adoptionReports[0];
  const items = adoptionReports
    .map(
      (report) => `<item>
      <title>${xml(report.title)}</title>
      <link>${siteOrigin}/adoption/${report.date}</link>
      <guid isPermaLink="true">${siteOrigin}/adoption/${report.date}</guid>
      <description>${xml(`${report.dek} ${report.changeSummary}`)}</description>
      <pubDate>${new Date(report.generatedAt).toUTCString()}</pubDate>
      <category>WebMCP adoption</category>
    </item>`,
    )
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>isWebMCP Daily Adoption Report</title>
    <link>${siteOrigin}/adoption</link>
    <description>Daily, evidence-scoped reporting on WebMCP implementations and tools.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(latest.generatedAt).toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${siteOrigin}/adoption/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
