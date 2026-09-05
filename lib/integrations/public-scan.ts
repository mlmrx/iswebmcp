import {
  fetchPublicText,
  MAX_RESPONSE_BYTES,
  normalizePublicUrl,
  ScanFailure,
  toScanError,
} from '@/lib/network';
import { analyzeSource } from '@/lib/scanner';
import { acquireScanSlot, allowRequest, putReport } from '@/lib/scan-store';
import type { ScanReport } from '@/lib/types';
import { sourceComparisonContext } from '@/lib/integrations/comparison-context';
import {
  beginUrlAttempt,
  completeUrlAttempt,
  type UrlAttemptSurface,
} from '@/lib/url-attempt-store';

export interface PublicScanRequest {
  url: string;
  goal?: string;
  signal?: AbortSignal;
  redirectRateLimitPrefix?: string;
  surface?: UrlAttemptSurface;
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

/**
 * Runs the same bounded, source-only scan for first-party UI and integrations.
 * Callers own their client-level rate limit; redirect targets are rate-limited
 * here so every integration preserves the scanner's network safety model.
 */
export async function runPublicSourceScan({
  url,
  goal,
  signal,
  redirectRateLimitPrefix = 'integration-host',
  surface = 'integration',
}: PublicScanRequest): Promise<ScanReport> {
  const attempt = await beginUrlAttempt(url, surface);
  try {
    const normalized = normalizePublicUrl(url);
    const releaseSlot = acquireScanSlot();
    if (!releaseSlot) {
      throw new ScanFailure(
        'RATE_LIMITED',
        'The scanner is at its safe concurrency limit. Try again shortly.',
        503,
      );
    }

    const chargedHosts = new Set<string>();
    let fetched: Awaited<ReturnType<typeof fetchPublicText>>;
    try {
      fetched = await fetchPublicText(
        normalized.toString(),
        signal,
        (target) => {
          const host = target.hostname.toLowerCase().replace(/\.$/, '');
          if (chargedHosts.has(host)) return;
          chargedHosts.add(host);
          if (!allowRequest(`${redirectRateLimitPrefix}:${host}`, 30)) {
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
      goal: goal || undefined,
      html: fetched.text,
      status: fetched.status,
      contentType: fetched.contentType,
      bytesRead: fetched.bytesRead,
      declaredBytes: fetched.declaredBytes,
      analysisLimitBytes: MAX_RESPONSE_BYTES,
      truncated: fetched.truncated,
      redirects: fetched.redirects,
    });

    report.comparisonContext = sourceComparisonContext({
      requestedUrl: normalized.toString(),
      finalUrl: fetched.finalUrl,
      goal,
      analysisLimitBytes: MAX_RESPONSE_BYTES,
    });
    putReport(report);
    await completeUrlAttempt(attempt, {
      outcome: 'succeeded',
      responseStatus: 201,
      reportId: report.id,
    });
    return report;
  } catch (error) {
    const normalized = toScanError(error);
    await completeUrlAttempt(attempt, {
      outcome: 'failed',
      errorCode: normalized.body.error.code,
      responseStatus: normalized.status,
    });
    throw error;
  }
}
