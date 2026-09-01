import snapshotData from '@/data/webmcp-index/snapshot.json';

export function GET() {
  return Response.json(snapshotData, {
    headers: {
      'cache-control':
        'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
