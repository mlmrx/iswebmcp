export const dynamic = 'force-dynamic';

// The owner withdrew the public research pages and downloads. Retain only a
// non-cacheable tombstone so old links cannot expose the private research.
export function GET() {
  return new Response('This page is no longer available.\n', {
    status: 410,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-content-type-options': 'nosniff',
    },
  });
}
