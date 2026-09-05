import { createHash } from 'node:crypto';

import type { ScanReport } from '@/lib/types';

/**
 * Equality metadata, not authentication or anonymization. Never include raw
 * goals or query values in the returned context. Keep URL query order because
 * servers may interpret duplicate parameters in an order-dependent way.
 */
export function sourceComparisonContext(input: {
  requestedUrl: string;
  finalUrl: string;
  goal?: string;
  analysisLimitBytes: number;
}): NonNullable<ScanReport['comparisonContext']> {
  const canonicalUrl = (value: string) => {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
  };
  const version = 'source-input/v1';
  const digest = createHash('sha256')
    .update(
      JSON.stringify([
        version,
        canonicalUrl(input.requestedUrl),
        canonicalUrl(input.finalUrl),
        input.goal?.trim() || '',
        input.analysisLimitBytes,
      ]),
    )
    .digest('hex');
  return { version, fingerprint: `sha256:${digest}` };
}
