import { describe, expect, it } from 'vitest';

import { isCrossSiteMutation } from '@/lib/request-origin';

function mutationRequest(
  url: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, { method: 'POST', headers });
}

describe('mutation origin checks', () => {
  it('accepts an origin matching the request URL', () => {
    expect(
      isCrossSiteMutation(
        mutationRequest('https://iswebmcp.com/api/scans', {
          origin: 'https://iswebmcp.com',
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(false);
  });

  it('accepts the public Host when a server uses an internal request URL', () => {
    expect(
      isCrossSiteMutation(
        mutationRequest('http://localhost:4173/api/scans', {
          host: '127.0.0.1:4173',
          origin: 'http://127.0.0.1:4173',
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(false);
  });

  it('accepts an HTTPS origin supplied by a trusted reverse proxy', () => {
    expect(
      isCrossSiteMutation(
        mutationRequest('http://internal:3000/api/scans', {
          origin: 'https://iswebmcp.com',
          'x-forwarded-host': 'iswebmcp.com',
          'x-forwarded-proto': 'https',
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(false);
  });

  it('rejects cross-site browser metadata even when Host is forged', () => {
    expect(
      isCrossSiteMutation(
        mutationRequest('https://iswebmcp.com/api/scans', {
          host: 'evil.example',
          origin: 'https://evil.example',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).toBe(true);
  });

  it('rejects foreign and malformed origins', () => {
    expect(
      isCrossSiteMutation(
        mutationRequest('https://iswebmcp.com/api/scans', {
          origin: 'https://evil.example',
        }),
      ),
    ).toBe(true);
    expect(
      isCrossSiteMutation(
        mutationRequest('https://iswebmcp.com/api/scans', {
          origin: 'null',
        }),
      ),
    ).toBe(true);
  });

  it('preserves originless non-browser API requests', () => {
    expect(
      isCrossSiteMutation(mutationRequest('https://iswebmcp.com/api/scans')),
    ).toBe(false);
  });
});
