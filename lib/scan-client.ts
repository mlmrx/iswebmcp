import type { ScanErrorBody, ScanReport } from '@/lib/types';
import { normalizePublicUrl, ScanFailure } from '@/lib/network';

export const CLIENT_SCAN_TIMEOUT_MS = 18_000;

export type ScanFailureStage = 'validation' | 'request' | 'fetch' | 'response';

type ScanErrorCode = ScanErrorBody['error']['code'];

const supportedErrorCodes = new Set<ScanErrorCode>([
  'INVALID_INPUT',
  'UNSAFE_TARGET',
  'UNSUPPORTED_CONTENT',
  'UPSTREAM_TIMEOUT',
  'UPSTREAM_FAILURE',
  'RESPONSE_TOO_LARGE',
  'RATE_LIMITED',
]);

export class ScanClientError extends Error {
  constructor(
    readonly code: ScanErrorCode,
    message: string,
    readonly stage: ScanFailureStage,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ScanClientError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeHostWithPort(value: string): boolean {
  const authority = value.split(/[/?#]/, 1)[0] ?? '';
  return /^(?:\[[^\]]+\]|[^:]+):\d+$/.test(authority);
}

/**
 * Make the common `example.com/path` input friendly without weakening the
 * server's public-target policy. The API remains the authority for SSRF,
 * credentials, port, DNS, and redirect validation.
 */
export function normalizeScanUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new ScanClientError(
      'INVALID_INPUT',
      'Enter a public website, such as example.com or https://example.com.',
      'validation',
      false,
    );
  }

  const hasHttpScheme = /^https?:\/\//i.test(trimmed);
  const hasAnotherScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const candidate = hasHttpScheme
    ? trimmed
    : trimmed.startsWith('//')
      ? `https:${trimmed}`
      : hasAnotherScheme && !looksLikeHostWithPort(trimmed)
        ? trimmed
        : `https://${trimmed}`;

  let parsed: URL;
  try {
    // Mirror the server's cheap URL checks in the browser so obviously unsafe
    // targets fail immediately. DNS and redirect validation still remain
    // authoritative on the server.
    parsed = normalizePublicUrl(candidate);
  } catch (error) {
    if (error instanceof ScanFailure) {
      throw new ScanClientError(error.code, error.message, 'validation', false);
    }
    throw new ScanClientError(
      'INVALID_INPUT',
      'That website address is not valid. Try example.com or paste a complete HTTPS URL.',
      'validation',
      false,
    );
  }

  return parsed.toString();
}

function isScanReport(value: unknown): value is ScanReport {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.status === 'complete' &&
    typeof value.normalizedUrl === 'string' &&
    isRecord(value.response) &&
    isRecord(value.baselineActionability)
  );
}

function safeMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 400) : null;
}

function actionableMessage(
  code: ScanErrorCode,
  serverMessage: string | null,
): string {
  switch (code) {
    case 'INVALID_INPUT':
      return `${serverMessage ?? 'The website address was not accepted.'} Check the address and retry.`;
    case 'UNSAFE_TARGET':
      return `${serverMessage ?? 'That destination is outside the public scanner boundary.'} Use a public URL on standard HTTP or HTTPS ports.`;
    case 'UNSUPPORTED_CONTENT':
      return `${serverMessage ?? 'The target did not return an HTML page.'} Try the site's public HTML homepage or another HTML page.`;
    case 'UPSTREAM_TIMEOUT':
      return 'The public-source fetch timed out before the target finished responding. Retry once, or scan a more specific public page.';
    case 'RATE_LIMITED':
      return `${serverMessage ?? 'The scanner is temporarily busy or rate limited.'} Wait a minute, then retry.`;
    case 'RESPONSE_TOO_LARGE':
      return 'The hosted scanner hit a response-size boundary before it could return a report. Retry once; if it repeats, scan a smaller public page.';
    case 'UPSTREAM_FAILURE':
      if (serverMessage && /HTTP\s+(?:401|403)\b/i.test(serverMessage)) {
        return `${serverMessage} The site declined automated source access; try another public HTML page on the same site.`;
      }
      if (serverMessage && /HTTP\s+429\b/i.test(serverMessage)) {
        return `${serverMessage} Wait before retrying or choose another public page.`;
      }
      return `${serverMessage ?? 'The target could not be fetched safely.'} Check that the page is public, then retry.`;
  }
}

function errorFromStatus(status: number): ScanClientError {
  if (status === 408 || status === 504) {
    return new ScanClientError(
      'UPSTREAM_TIMEOUT',
      'The scanner timed out while waiting for the public page. Retry once, or scan a more specific public page.',
      'response',
      true,
    );
  }
  if (status === 413) {
    return new ScanClientError(
      'RESPONSE_TOO_LARGE',
      'The hosting boundary rejected an oversized scan response. Retry once; if it repeats, scan a smaller public page.',
      'response',
      true,
    );
  }
  if (status === 429 || status === 503) {
    return new ScanClientError(
      'RATE_LIMITED',
      'The scanner is temporarily busy or rate limited. Wait a minute, then retry.',
      'response',
      true,
    );
  }
  if (status === 415) {
    return new ScanClientError(
      'UNSUPPORTED_CONTENT',
      'The target did not return a supported HTML page. Try its public HTML homepage.',
      'response',
      false,
    );
  }
  return new ScanClientError(
    'UPSTREAM_FAILURE',
    status >= 500
      ? 'The scanner service could not complete the request. Retry in a moment.'
      : 'The scanner returned an unreadable response. Check the address and retry.',
    'response',
    true,
  );
}

export async function parseScanApiResponse(
  response: Response,
): Promise<ScanReport> {
  let payload: unknown = null;
  try {
    const raw = await response.text();
    if (raw) payload = JSON.parse(raw) as unknown;
  } catch {
    // Hosting and proxy failures can return HTML. Never surface raw markup or
    // JSON parser implementation details to the user.
  }

  if (!response.ok) {
    if (isRecord(payload) && isRecord(payload.error)) {
      const rawCode = payload.error.code;
      const code =
        typeof rawCode === 'string' &&
        supportedErrorCodes.has(rawCode as ScanErrorCode)
          ? (rawCode as ScanErrorCode)
          : null;
      if (code) {
        throw new ScanClientError(
          code,
          actionableMessage(code, safeMessage(payload.error.message)),
          'response',
          !['INVALID_INPUT', 'UNSAFE_TARGET', 'UNSUPPORTED_CONTENT'].includes(
            code,
          ),
        );
      }
    }
    throw errorFromStatus(response.status);
  }

  if (!isScanReport(payload)) {
    throw new ScanClientError(
      'UPSTREAM_FAILURE',
      'The scanner returned an incomplete report. Retry the scan in a moment.',
      'response',
      true,
    );
  }
  return payload;
}
