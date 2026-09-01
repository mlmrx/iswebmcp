const origin = 'https://iswebmcp.mlmrx.chatgpt.site';

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /reports/\nSitemap: ${origin}/sitemap.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}
