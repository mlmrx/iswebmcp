import {
  auditImportedManifest,
  deriveReportWithImportedAudit,
  importedManifestRequestSchema,
} from '@/lib/imported-manifest';
import { isCrossSiteMutation } from '@/lib/request-origin';
import { allowRequest, getReport, putReport } from '@/lib/scan-store';

const MAX_IMPORT_BYTES = 128_000;

async function readBody(request: Request): Promise<unknown> {
  if (!request.body) throw new Error('INVALID_JSON');
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
      if (total > MAX_IMPORT_BYTES) {
        await reader.cancel();
        throw new Error('TOO_LARGE');
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
  try {
    return JSON.parse(new TextDecoder().decode(merged)) as unknown;
  } catch {
    throw new Error('INVALID_JSON');
  }
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
            code: 'INVALID_MANIFEST',
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
            code: 'INVALID_MANIFEST',
            message: 'Cross-site import requests are not allowed.',
          },
        },
        { status: 403 },
      );
    }
    const requester = (
      request.headers.get('cf-connecting-ip') ?? 'local-or-anonymous'
    )
      .trim()
      .slice(0, 64);
    if (!allowRequest(`import:${requester}`, 10)) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many manifest audits. Try again in a minute.',
          },
        },
        {
          status: 429,
          headers: { 'cache-control': 'no-store', 'retry-after': '60' },
        },
      );
    }
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_IMPORT_BYTES) throw new Error('TOO_LARGE');
    const body = await readBody(request);
    const parsed = importedManifestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: 'INVALID_MANIFEST',
            message:
              'Provide a current scan ID and 1–50 sanitized tool definitions using only supported contract fields.',
          },
        },
        { status: 400, headers: { 'cache-control': 'no-store' } },
      );
    }
    const report = getReport(parsed.data.scanId);
    if (!report) {
      return Response.json(
        {
          error: {
            code: 'REPORT_UNAVAILABLE',
            message:
              'The source report is unavailable or expired. Run a new scan before importing.',
          },
        },
        { status: 404, headers: { 'cache-control': 'no-store' } },
      );
    }
    const audit = auditImportedManifest(parsed.data, report);
    const derived = deriveReportWithImportedAudit(report, audit);
    putReport(derived);
    return Response.json(derived, {
      status: 201,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'TOO_LARGE';
    const timedOut = error instanceof Error && error.message === 'BODY_TIMEOUT';
    const unsafe =
      error instanceof Error &&
      ['UNSAFE_SCHEMA', 'CREDENTIAL_LIKE_DATA'].includes(error.message);
    const provenance =
      error instanceof Error &&
      ['INVALID_PROVENANCE', 'ORIGIN_MISMATCH'].includes(error.message);
    return Response.json(
      {
        error: {
          code: tooLarge
            ? 'IMPORT_TOO_LARGE'
            : timedOut
              ? 'IMPORT_TIMEOUT'
              : unsafe
                ? 'UNSAFE_MANIFEST'
                : provenance
                  ? 'INVALID_PROVENANCE'
                  : 'INVALID_JSON',
          message: tooLarge
            ? 'The manifest exceeds the 128 KB import limit.'
            : timedOut
              ? 'The manifest request body took too long to arrive.'
              : unsafe
                ? 'The manifest contains unsafe schema structure or credential-like data. Remove it before importing.'
                : provenance
                  ? 'The capture provenance is invalid or does not match the scanned origin.'
                  : 'The manifest must be valid JSON.',
        },
      },
      {
        status: tooLarge ? 413 : timedOut ? 408 : 400,
        headers: { 'cache-control': 'no-store' },
      },
    );
  }
}
