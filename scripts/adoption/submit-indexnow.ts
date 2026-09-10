const INDEXNOW_KEY = 'c7a42b1365a849479a4ebd5483103d37';
const publicationOrigin = (
  process.env.SITE_ORIGIN ?? 'https://iswebmcp.com'
).replace(/\/$/, '');
const date = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
  throw new Error('Pass the published report date as YYYY-MM-DD.');
}

const urlList = [
  `${publicationOrigin}/adoption`,
  `${publicationOrigin}/adoption/${date}`,
  `${publicationOrigin}/adoption/data.json`,
  `${publicationOrigin}/adoption/latest.md`,
  `${publicationOrigin}/adoption/feed.xml`,
  `${publicationOrigin}/llms.txt`,
  `${publicationOrigin}/sitemap.xml`,
];
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    host: new URL(publicationOrigin).host,
    key: INDEXNOW_KEY,
    keyLocation: `${publicationOrigin}/${INDEXNOW_KEY}.txt`,
    urlList,
  }),
});
if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow submission failed with HTTP ${response.status}.`);
}
console.log(
  `IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`,
);

export {};
