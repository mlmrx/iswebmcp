import { describe, expect, it } from 'vitest';

import { OPTIONS } from '@/app/api/integrations/scan/route';

describe('integration scan CORS boundary', () => {
  it('allows a Chrome extension origin without enabling credentials', async () => {
    const origin = `chrome-extension://${'a'.repeat(32)}`;
    const response = OPTIONS(
      new Request('https://iswebmcp.com/api/integrations/scan', {
        method: 'OPTIONS',
        headers: { origin },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('does not grant browser CORS to ordinary web origins', async () => {
    const response = OPTIONS(
      new Request('https://iswebmcp.com/api/integrations/scan', {
        method: 'OPTIONS',
        headers: { origin: 'https://attacker.example' },
      }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
