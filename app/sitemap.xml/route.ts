import { learningArticles, learningCatalogUpdatedAt } from '@/lib/content';
import { pulseGeneratedAt } from '@/lib/pulse';
import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  const pulseLastmod = pulseGeneratedAt.slice(0, 10);
  const productLastmod =
    pulseLastmod.localeCompare(learningCatalogUpdatedAt) > 0
      ? pulseLastmod
      : learningCatalogUpdatedAt;
  const staticPages = [
    { path: '', lastmod: productLastmod },
    { path: '/learn', lastmod: learningCatalogUpdatedAt },
    { path: '/faq', lastmod: learningCatalogUpdatedAt },
    { path: '/readiness-index', lastmod: '2026-09-01' },
    { path: '/readiness-index-methodology', lastmod: '2026-09-01' },
    { path: '/pulse', lastmod: pulseLastmod },
    { path: '/methodology', lastmod: '2026-08-31' },
    { path: '/lab', lastmod: '2026-09-01' },
    { path: '/demos', lastmod: '2026-09-01' },
    { path: '/workbench', lastmod: '2026-08-31' },
  ];
  const urls = [
    ...staticPages.map(({ path, lastmod }) => ({
      loc: `${siteOrigin}${path}`,
      lastmod,
    })),
    ...learningArticles.map((article) => ({
      loc: `${siteOrigin}/learn/${article.slug}`,
      lastmod: article.updatedAt,
    })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;
  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
