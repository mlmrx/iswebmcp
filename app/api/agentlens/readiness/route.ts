import { z } from 'zod';

import { runAgentReadinessAudit } from '@/lib/agentlens-readiness';
import { toScanError } from '@/lib/network';
import { isCrossSiteMutation } from '@/lib/request-origin';
import { allowRequest } from '@/lib/scan-store';

export const runtime = 'nodejs';
export const maxDuration = 30;

const requestSchema = z
  .object({ url: z.string().trim().min(1).max(2_048) })
  .strict();

function requesterIp(request: Request): string {
  const forwarded =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('cf-connecting-ip') ??
    'local-or-anonymous';
  return (forwarded.split(',', 1)[0] ?? 'local-or-anonymous')
    .trim()
    .slice(0, 64);
}

async function readBoundedJson(request: Request): Promise<unknown> {
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
      if (total > 4_096) {
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
            message: 'Cross-site readiness checks are not allowed.',
          },
        },
        { status: 403 },
      );
    }
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 4_096) {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'The request is too large.',
          },
        },
        { status: 413 },
      );
    }
    const ip = requesterIp(request);
    if (!allowRequest(`agentlens-readiness-ip:${ip}`, 4)) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message:
              'Too many readiness checks from this client. Try again in a minute.',
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
              ? 'The request is too large.'
              : timedOut
                ? 'The request body took too long to arrive.'
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
            message: 'Provide one public HTTP or HTTPS URL.',
          },
        },
        { status: 400 },
      );
    }

    const report = await runAgentReadinessAudit(parsed.data.url);
    return Response.json(report, {
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
