import { z } from 'zod';

import { saveAgentLensUpdateSignup } from '@/lib/agentlens-interest-store';
import { isCrossSiteMutation } from '@/lib/request-origin';
import { allowRequest } from '@/lib/scan-store';

export const runtime = 'nodejs';
export const maxDuration = 10;

const requestSchema = z
  .object({
    email: z.email().trim().min(3).max(254),
    consent: z.literal(true),
    website: z.string().max(200).optional(),
  })
  .strict();

const successResponse = () =>
  Response.json(
    { ok: true },
    {
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

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
      if (total > 2_048) {
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
  const headers = {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };

  const contentType =
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() ?? '';
  if (contentType !== 'application/json') {
    return Response.json(
      { error: { message: 'Content-Type must be application/json.' } },
      { status: 415, headers },
    );
  }
  if (isCrossSiteMutation(request)) {
    return Response.json(
      { error: { message: 'Cross-site signups are not allowed.' } },
      { status: 403, headers },
    );
  }
  if (Number(request.headers.get('content-length') ?? 0) > 2_048) {
    return Response.json(
      { error: { message: 'The signup request is too large.' } },
      { status: 413, headers },
    );
  }

  const ip = requesterIp(request);
  if (!allowRequest(`agentlens-updates-ip:${ip}`, 3, 60 * 60 * 1_000)) {
    return Response.json(
      { error: { message: 'Please wait before trying again.' } },
      { status: 429, headers: { ...headers, 'retry-after': '3600' } },
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    const tooLarge =
      error instanceof Error && error.message === 'BODY_TOO_LARGE';
    const timedOut = error instanceof Error && error.message === 'BODY_TIMEOUT';
    return Response.json(
      {
        error: {
          message: tooLarge
            ? 'The signup request is too large.'
            : timedOut
              ? 'The request took too long. Please try again.'
              : 'Provide a valid email address and opt in to updates.',
        },
      },
      { status: tooLarge ? 413 : timedOut ? 408 : 400, headers },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          message: 'Provide a valid email address and opt in to updates.',
        },
      },
      { status: 400, headers },
    );
  }

  // A hidden honeypot absorbs simple form bots without storing their data.
  if (parsed.data.website?.trim()) return successResponse();

  try {
    await saveAgentLensUpdateSignup(parsed.data.email);
    return successResponse();
  } catch (error) {
    const kind = error instanceof Error ? error.name : 'UnknownError';
    console.error(`AgentLens updates signup persistence failed (${kind}).`);
    return Response.json(
      {
        error: {
          message:
            'Signup could not be saved right now. Please try again later.',
        },
      },
      { status: 503, headers },
    );
  }
}
