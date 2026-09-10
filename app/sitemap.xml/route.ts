import { learningArticles, learningCatalogUpdatedAt } from '@/lib/content';
import { adoptionReports, latestAdoptionReport } from '@/lib/adoption';
import { pulseGeneratedAt } from '@/lib/pulse';
import { siteOrigin } from '@/lib/site-origin';

export function GET() {
  const pulseLastmod = pulseGeneratedAt.slice(0, 10);
  const productLastmod = [
    pulseLastmod,
    learningCatalogUpdatedAt,
    latestAdoptionReport.date,
  ].sort((a, b) => b.localeCompare(a))[0];
  const staticPages = [
    { path: '', lastmod: productLastmod },
    { path: '/learn', lastmod: learningCatalogUpdatedAt },
    { path: '/faq', lastmod: learningCatalogUpdatedAt },
    { path: '/readiness-index', lastmod: '2026-09-01' },
    { path: '/readiness-index-methodology', lastmod: '2026-09-01' },
    { path: '/pulse', lastmod: pulseLastmod },
    { path: '/adoption', lastmod: latestAdoptionReport.date },
    { path: '/methodology', lastmod: '2026-08-31' },
    { path: '/lab', lastmod: '2026-09-01' },
    { path: '/demos', lastmod: '2026-09-01' },
    { path: '/integrations', lastmod: '2026-09-05' },
    { path: '/developers', lastmod: '2026-09-06' },
    { path: '/developers/offline', lastmod: '2026-09-06' },
    { path: '/developers/recipes', lastmod: '2026-09-05' },
    { path: '/privacy', lastmod: '2026-09-06' },
    { path: '/terms', lastmod: '2026-09-03' },
    { path: '/support', lastmod: '2026-09-03' },
    { path: '/security', lastmod: '2026-09-02' },
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
    ...adoptionReports.map((report) => ({
      loc: `${siteOrigin}/adoption/${report.date}`,
      lastmod: report.date,
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
