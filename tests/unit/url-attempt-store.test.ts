import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  beginUrlAttempt,
  completeUrlAttempt,
  sanitizeAttemptUrl,
  urlAttemptStorageConfigured,
} from '@/lib/url-attempt-store';

describe('URL-attempt privacy boundary', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('retains a normalized public origin and path only', () => {
    expect(
      sanitizeAttemptUrl(
        'https://Example.COM/products/widget?token=secret#private',
      ),
    ).toEqual({
      safeUrl: 'https://example.com/products/widget',
      hostname: 'example.com',
      queryRedacted: true,
    });
  });

  it.each([
    'not a URL',
    'https://user:password@example.com/private',
    'http://127.0.0.1/admin',
    'http://service.internal/private',
    'file:///etc/passwd',
  ])(
    'does not retain malformed, credential-bearing, or unsafe input %s',
    (url) => {
      expect(sanitizeAttemptUrl(url)).toBeNull();
    },
  );

  it('is a no-op when durable storage is not configured', async () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(urlAttemptStorageConfigured()).toBe(false);
    await expect(
      beginUrlAttempt('https://example.com', 'web'),
    ).resolves.toBeNull();
    await expect(
      completeUrlAttempt(null, { outcome: 'succeeded' }),
    ).resolves.toBeUndefined();
  });
});
