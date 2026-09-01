import { z } from 'zod';

import {
  fetchPublicText,
  normalizePublicUrl,
  ScanFailure,
  toScanError,
} from '@/lib/network';
import { isCrossSiteMutation } from '@/lib/request-origin';
import { analyzeSource } from '@/lib/scanner';
import { acquireScanSlot, allowRequest, putReport } from '@/lib/scan-store';

const requestSchema = z
  .object({
    url: z.string().trim().min(1).max(2_048),
    goal: z.string().trim().max(300).optional(),
  })
  .strict();

function requesterIp(request: Request): string {
  const ip = (request.headers.get('cf-connecting-ip') ?? 'local-or-anonymous')
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

function reportSafeUrl(value: string): {
  value: string;
  queryRedacted: boolean;
} {
  const url = new URL(value);
  const queryRedacted = Boolean(url.search);
  url.search = '';
  return { value: url.toString(), queryRedacted };
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

    const normalized = normalizePublicUrl(parsed.data.url);
    const releaseSlot = acquireScanSlot();
    if (!releaseSlot) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message:
              'The scanner is at its safe concurrency limit. Try again shortly.',
          },
        },
        { status: 503, headers: { 'retry-after': '5' } },
      );
    }
    const chargedHosts = new Set<string>();
    let fetched: Awaited<ReturnType<typeof fetchPublicText>>;
    try {
      fetched = await fetchPublicText(
        normalized.toString(),
        request.signal,
        (target) => {
          const host = target.hostname.toLowerCase().replace(/\.$/, '');
          if (chargedHosts.has(host)) return;
          chargedHosts.add(host);
          if (!allowRequest(`host:${host}`, 30)) {
            throw new ScanFailure(
              'RATE_LIMITED',
              'Too many scans for a redirect target. Try again in a minute.',
              429,
            );
          }
        },
      );
    } finally {
      releaseSlot();
    }
    const normalizedForReport = reportSafeUrl(normalized.toString());
    const finalForReport = reportSafeUrl(fetched.finalUrl);
    const report = analyzeSource({
      normalizedUrl: normalizedForReport.value,
      finalUrl: finalForReport.value,
      queryRedacted:
        normalizedForReport.queryRedacted || finalForReport.queryRedacted,
      goal: parsed.data.goal || undefined,
      html: fetched.text,
      status: fetched.status,
      contentType: fetched.contentType,
      bytesRead: fetched.bytesRead,
      redirects: fetched.redirects,
    });
    putReport(report);
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
