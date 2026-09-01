import { learningArticles, learningCatalogUpdatedAt } from '@/lib/content';
import { pulseGeneratedAt, pulseUpdates } from '@/lib/pulse';

const origin = 'https://iswebmcp.mlmrx.chatgpt.site';

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const lastBuildDate = new Date(
    Math.max(
      Date.parse(pulseGeneratedAt),
      Date.parse(`${learningCatalogUpdatedAt}T23:59:59Z`),
    ),
  ).toUTCString();
  const articleItems = learningArticles.map(
    (article) => `<item>
      <title>${xml(article.title)}</title>
      <link>${origin}/learn/${xml(article.slug)}</link>
      <guid isPermaLink="true">${origin}/learn/${xml(article.slug)}</guid>
      <description>${xml(article.dek)}</description>
      <pubDate>${new Date(`${article.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${xml(article.kind)}</category>
    </item>`,
  );
  const updateItems = pulseUpdates.map(
    (item) => `<item>
      <title>${xml(item.title)}</title>
      <link>${xml(item.sourceUrl)}</link>
      <guid isPermaLink="false">${origin}/pulse#${xml(item.id)}</guid>
      <description>${xml(`${item.summary} Source: ${item.sourceName}.`)}</description>
      <pubDate>${new Date(`${item.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${xml(item.topic)}</category>
      <source url="${origin}/feed.xml">isWebMCP Pulse</source>
    </item>`,
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>isWebMCP Learning &amp; Pulse</title>
    <link>${origin}/learn</link>
    <description>Original WebMCP guidance and source-linked ecosystem updates.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
    ${[...articleItems, ...updateItems].join('\n')}
  </channel>
</rss>`;
  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
