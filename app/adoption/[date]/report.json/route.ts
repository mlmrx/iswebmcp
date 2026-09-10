import { getAdoptionReport } from '@/lib/adoption';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  const report = getAdoptionReport(date);
  if (!report) {
    return Response.json(
      { error: 'REPORT_NOT_FOUND', date },
      { status: 404, headers: { 'cache-control': 'no-store' } },
    );
  }
  return Response.json(report, {
    headers: {
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300, s-maxage=86400, immutable',
    },
  });
}
