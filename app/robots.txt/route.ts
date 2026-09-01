import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /reports/\nSitemap: ${siteOrigin}/sitemap.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}
