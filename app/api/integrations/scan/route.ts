import { z } from 'zod';

import { runPublicSourceScan } from '@/lib/integrations/public-scan';
import { summarizeReport } from '@/lib/integrations/report-summary';
import { toScanError } from '@/lib/network';
import { allowRequest } from '@/lib/scan-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_REQUEST_BYTES = 8_192;
const requestSchema = z
  .object({
    url: z.string().trim().min(1).max(2_048),
    goal: z.string().trim().max(300).optional(),
  })
  .strict();

function extensionOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  return /^chrome-extension:\/\/[a-p]{32}$/i.test(origin) ? origin : '';
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'access-control-allow-origin': origin || 'null',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '3600',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    vary: 'Origin',
  };
}

function requesterKey(request: Request, origin: string | null): string {
  const forwarded =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('cf-connecting-ip') ??
    'local-or-anonymous';
  const ip = (forwarded.split(',', 1)[0] ?? 'local-or-anonymous')
    .trim()
    .slice(0, 64);
  return `${origin || 'native'}:${ip}`;
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_REQUEST_BYTES) {
    throw new Error('BODY_TOO_LARGE');
  }
  return JSON.parse(text) as unknown;
}

export function OPTIONS(request: Request) {
  const origin = extensionOrigin(request);
  if (origin === '') return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = extensionOrigin(request);
  if (origin === '') {
    return Response.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message:
            'This integration endpoint accepts native clients and installed Chrome extensions only.',
        },
      },
      { status: 403, headers: corsHeaders(null) },
    );
  }

  const headers = corsHeaders(origin);
  try {
    const contentType =
      request.headers
        .get('content-type')
        ?.split(';', 1)[0]
        ?.trim()
        .toLowerCase() ?? '';
    if (contentType !== 'application/json') {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Content-Type must be application/json.',
          },
        },
        { status: 415, headers },
      );
    }

    let body: unknown;
    try {
      body = await readBoundedJson(request);
    } catch (error) {
      const tooLarge =
        error instanceof Error && error.message === 'BODY_TOO_LARGE';
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: tooLarge
              ? 'The scan request is too large.'
              : 'The request body must be valid JSON.',
          },
        },
        { status: tooLarge ? 413 : 400, headers },
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              'Provide a public URL and an optional goal up to 300 characters.',
          },
        },
        { status: 400, headers },
      );
    }

    const key = requesterKey(request, origin);
    if (!allowRequest(`integration:${key}`, 12)) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message:
              'Too many integration scans from this client. Try again in a minute.',
          },
        },
        {
          status: 429,
          headers: { ...headers, 'retry-after': '60' },
        },
      );
    }

    const report = await runPublicSourceScan({
      url: parsed.data.url,
      goal: parsed.data.goal,
      signal: request.signal,
      redirectRateLimitPrefix: 'integration-host',
    });

    return Response.json(summarizeReport(report), { status: 201, headers });
  } catch (error) {
    const normalized = toScanError(error);
    return Response.json(normalized.body, {
      status: normalized.status,
      headers,
    });
  }
}
