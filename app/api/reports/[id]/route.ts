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
          message: 'This ephemeral report is unavailable or has expired.',
        },
      },
      { status: 404, headers: { 'cache-control': 'no-store' } },
    );
  }
  return new Response(JSON.stringify(report, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="iswebmcp-${id}.json"`,
      'cache-control': 'private, max-age=30',
      'x-content-type-options': 'nosniff',
    },
  });
}
