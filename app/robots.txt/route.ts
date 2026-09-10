import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /reports/\nSitemap: ${siteOrigin}/sitemap.xml\n\n# Machine-readable WebMCP adoption index\n# ${siteOrigin}/llms.txt\n# ${siteOrigin}/adoption/data.json\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}
