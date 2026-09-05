import { learningArticles, learningCatalogUpdatedAt } from '@/lib/content';
import { pulseGeneratedAt } from '@/lib/pulse';
import { siteOrigin } from '@/lib/site-origin';
import { enterpriseScenarios } from '@/lib/enterprise/scenarios';
import { partnerProspects } from '@/lib/enterprise/partners';
import { researchReviewedAt } from '@/lib/enterprise/research';

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
    { path: '/integrations', lastmod: '2026-09-05' },
    { path: '/developers', lastmod: '2026-09-05' },
    { path: '/developers/recipes', lastmod: '2026-09-05' },
    ...['/enterprise', '/enterprise/scenarios', '/enterprise/partners'].map(
      (path) => ({ path, lastmod: researchReviewedAt }),
    ),
    ...enterpriseScenarios.map((scenario) => ({
      path: `/enterprise/scenarios/${scenario.slug}`,
      lastmod: scenario.reviewedAt,
    })),
    ...partnerProspects.map((partner) => ({
      path: `/enterprise/partners/${partner.slug}`,
      lastmod: partner.reviewedAt,
    })),
    { path: '/privacy', lastmod: '2026-09-03' },
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
