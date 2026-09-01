import { describe, expect, it } from 'vitest';

import { resolveSiteOrigin } from '@/lib/site-origin';

describe('site origin resolution', () => {
  it('uses the explicit site URL before provider values', () => {
    expect(
      resolveSiteOrigin({
        SITE_URL: 'https://www.iswebmcp.com/ignored/path',
        VERCEL_PROJECT_PRODUCTION_URL: 'preview.vercel.app',
      }),
    ).toBe('https://www.iswebmcp.com');
  });

  it('normalizes a Vercel production hostname', () => {
    expect(
      resolveSiteOrigin({
        VERCEL_PROJECT_PRODUCTION_URL: 'iswebmcp.vercel.app',
      }),
    ).toBe('https://iswebmcp.vercel.app');
  });

  it('falls back to the branded production origin', () => {
    expect(resolveSiteOrigin({ SITE_URL: 'not a valid host' })).toBe(
      'https://iswebmcp.com',
    );
  });
});
