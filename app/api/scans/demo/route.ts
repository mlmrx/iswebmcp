import { isCrossSiteMutation } from '@/lib/request-origin';
import { makeDemoReport } from '@/lib/scanner';
import { allowRequest, putReport } from '@/lib/scan-store';

export async function POST(request: Request) {
  if (isCrossSiteMutation(request)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Cross-site sample requests are not allowed.',
        },
      },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );
  }
  const requester = (
    request.headers.get('cf-connecting-ip') ?? 'local-or-anonymous'
  )
    .trim()
    .slice(0, 64);
  if (!allowRequest(`sample:${requester}`, 20)) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many sample reports. Try again in a minute.',
        },
      },
      {
        status: 429,
        headers: { 'cache-control': 'no-store', 'retry-after': '60' },
      },
    );
  }
  const report = makeDemoReport();
  putReport(report);
  return Response.json(report, {
    status: 201,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
