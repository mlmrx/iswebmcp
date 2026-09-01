import { getReport } from '@/lib/scan-store';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const report = getReport(id);
  if (!report) {
    return Response.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'This ephemeral scan is unavailable or has expired.',
        },
      },
      { status: 404, headers: { 'cache-control': 'no-store' } },
    );
  }
  return Response.json(report, {
    headers: {
      'cache-control': 'private, max-age=30',
      'x-content-type-options': 'nosniff',
    },
  });
}
