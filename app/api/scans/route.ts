import { z } from 'zod';

import { runPublicSourceScan } from '@/lib/integrations/public-scan';
import { toScanError } from '@/lib/network';
import { isCrossSiteMutation } from '@/lib/request-origin';
import { allowRequest } from '@/lib/scan-store';

const requestSchema = z
  .object({
    url: z.string().trim().min(1).max(2_048),
    goal: z.string().trim().max(300).optional(),
  })
  .strict();

function requesterIp(request: Request): string {
  const forwarded =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('cf-connecting-ip') ??
    'local-or-anonymous';
  const ip = (forwarded.split(',', 1)[0] ?? 'local-or-anonymous')
    .trim()
    .slice(0, 64);
  return ip;
}

async function readBoundedJson(
  request: Request,
  maximumBytes = 8_192,
): Promise<unknown> {
  if (!request.body) throw new Error('EMPTY_BODY');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('BODY_TIMEOUT')), 3_000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new Error('BODY_TOO_LARGE');
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(merged)) as unknown;
}

export async function POST(request: Request) {
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
        { status: 415 },
      );
    }
    if (isCrossSiteMutation(request)) {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Cross-site scan requests are not allowed.',
          },
        },
        { status: 403 },
      );
    }
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 8_192) {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'The scan request is too large.',
          },
        },
        { status: 413 },
      );
    }
    const ip = requesterIp(request);
    if (!allowRequest(`ip:${ip}`, 12)) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message:
              'Too many scan requests from this client. Try again in a minute.',
          },
        },
        { status: 429, headers: { 'retry-after': '60' } },
      );
    }
    let body: unknown;
    try {
      body = await readBoundedJson(request);
    } catch (error) {
      const tooLarge =
        error instanceof Error && error.message === 'BODY_TOO_LARGE';
      const timedOut =
        error instanceof Error && error.message === 'BODY_TIMEOUT';
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: tooLarge
              ? 'The scan request is too large.'
              : timedOut
                ? 'The scan request body took too long to arrive.'
                : 'The request body must be valid JSON.',
          },
        },
        { status: tooLarge ? 413 : timedOut ? 408 : 400 },
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
        { status: 400 },
      );
    }

    const report = await runPublicSourceScan({
      url: parsed.data.url,
      goal: parsed.data.goal,
      signal: request.signal,
      redirectRateLimitPrefix: 'host',
      surface: 'web',
    });
    return Response.json(report, {
      status: 201,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    const normalized = toScanError(error);
    return Response.json(normalized.body, {
      status: normalized.status,
      headers: { 'cache-control': 'no-store' },
    });
  }
}
