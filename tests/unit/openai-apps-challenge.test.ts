import { describe, expect, it } from 'vitest';

import { GET } from '@/app/.well-known/openai-apps-challenge/route';

describe('OpenAI app domain verification', () => {
  it('serves the exact verification token as plain text', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    );
    expect(await response.text()).toBe(
      '7DxgMg4lbBg8aVFIh1JcpuHPHIZ66ior33Kx-yWXQ9U',
    );
  });
});
