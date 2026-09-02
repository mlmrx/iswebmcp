import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchPublicText,
  isPublicIpAddress,
  MAX_RESPONSE_BYTES,
  normalizePublicUrl,
  parseIpv4,
} from '@/lib/network';

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

describe('public target validation', () => {
  it.each([
    '127.0.0.1',
    '10.2.3.4',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '192.0.2.1',
    '198.51.100.5',
    '203.0.113.7',
    '::1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
    '2001:2::1',
    '2001:10::1',
    '2002:c0a8:101::1',
    '2d00::1',
    '3000::1',
    '3ffe::1',
    '3fff::1',
  ])('rejects non-public address %s', (address) => {
    expect(isPublicIpAddress(address)).toBe(false);
  });

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '2001:4860:4860::8888',
    '2606:4700:4700::1111',
    '2a00:1450:4009:80b::200e',
  ])('accepts public address %s', (address) =>
    expect(isPublicIpAddress(address)).toBe(true),
  );

  it('normalizes encoded IPv4 forms before rejecting them', () => {
    expect(parseIpv4('0x7f.1')).toEqual([127, 0, 0, 1]);
    expect(() => normalizePublicUrl('http://2130706433')).toThrow(
      /not allowed/i,
    );
    expect(() => normalizePublicUrl('http://0177.0.0.1')).toThrow(
      /not allowed/i,
    );
  });

  it('does not mistake a hexadecimal-looking domain for an IPv4 literal', () => {
    expect(normalizePublicUrl('https://face.de/path').hostname).toBe('face.de');
  });

  it('allows only standard HTTP and HTTPS ports', () => {
    expect(normalizePublicUrl('https://example.com:443/').port).toBe('');
    expect(() => normalizePublicUrl('https://example.com:8443/')).toThrow(
      /standard/i,
    );
  });

  it.each([
    'file:///etc/passwd',
    'https://user:password@example.com',
    'http://localhost:8080',
    'http://service.internal',
  ])('rejects unsafe URL %s', (url) => {
    expect(() => normalizePublicUrl(url)).toThrow();
  });
});

describe('bounded fetch', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses verified DNS and returns bounded text without forwarding credentials', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) {
          const isA = url.includes('type=A&') || url.endsWith('type=A');
          return Response.json({
            Status: 0,
            Answer: isA ? [{ type: 1, data: '93.184.216.34' }] : [],
          });
        }
        expect(init?.redirect).toBe('manual');
        expect(new Headers(init?.headers).has('authorization')).toBe(false);
        expect(new Headers(init?.headers).has('cookie')).toBe(false);
        return new Response('<html><button>Search</button></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPublicText('https://example.com');
    expect(result.status).toBe(200);
    expect(result.text).toContain('<button>');
    expect(result.bytesRead).toBeGreaterThan(0);
  });

  it('revalidates and rejects a redirect to a private target', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.startsWith('https://cloudflare-dns.com/')) {
        return Response.json({
          Status: 0,
          Answer: url.includes('type=A')
            ? [{ type: 1, data: '93.184.216.34' }]
            : [],
        });
      }
      return new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/admin' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchPublicText('https://example.com')).rejects.toMatchObject({
      code: 'UNSAFE_TARGET',
    });
  });

  it('rejects a reserved IPv6 address returned by DNS', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) {
          return Response.json({
            Status: 0,
            Answer: url.includes('type=AAAA')
              ? [{ type: 28, data: '3000::1' }]
              : [],
          });
        }
        return new Response('<h1>must not be fetched</h1>', {
          headers: { 'content-type': 'text/html' },
        });
      }),
    );
    await expect(fetchPublicText('https://example.com')).rejects.toMatchObject({
      code: 'UNSAFE_TARGET',
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('exposes every unique redirect target to the caller before fetching it', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.startsWith('https://cloudflare-dns.com/')) {
        return Response.json({
          Status: 0,
          Answer: url.includes('type=A')
            ? [{ type: 1, data: '93.184.216.34' }]
            : [],
        });
      }
      if (url.startsWith('https://example.com')) {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://www.example.org/final' },
        });
      }
      return new Response('<h1>Done</h1>', {
        headers: { 'content-type': 'text/html' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const targets: string[] = [];
    await fetchPublicText('https://example.com', undefined, (url) =>
      targets.push(url.hostname),
    );
    expect(targets).toEqual(['example.com', 'www.example.org']);
  });

  it('treats declared length as metadata when the actual body is small', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) {
          return Response.json({
            Status: 0,
            Answer: url.includes('type=A')
              ? [{ type: 1, data: '93.184.216.34' }]
              : [],
          });
        }
        return new Response('small', {
          headers: { 'content-type': 'text/html', 'content-length': '9999999' },
        });
      }),
    );
    const result = await fetchPublicText('https://example.com');
    expect(result.text).toBe('small');
    expect(result.bytesRead).toBe(5);
    expect(result.declaredBytes).toBe(9_999_999);
    expect(result.truncated).toBe(false);
  });

  it('returns a clean bounded prefix when the streamed body exceeds the limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) {
          return Response.json({
            Status: 0,
            Answer: url.includes('type=A')
              ? [{ type: 1, data: '93.184.216.34' }]
              : [],
          });
        }
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array(MAX_RESPONSE_BYTES).fill(97));
            controller.enqueue(new Uint8Array([98, 99]));
            controller.close();
          },
        });
        return new Response(body, {
          headers: { 'content-type': 'text/html' },
        });
      }),
    );

    const result = await fetchPublicText('https://example.com');
    expect(result.bytesRead).toBe(MAX_RESPONSE_BYTES);
    expect(result.text).toHaveLength(MAX_RESPONSE_BYTES);
    expect(result.text.endsWith('a')).toBe(true);
    expect(result.truncated).toBe(true);
  });

  it('rejects text/plain by default and allows an explicit robots opt-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) {
          return Response.json({
            Status: 0,
            Answer: url.includes('type=A')
              ? [{ type: 1, data: '93.184.216.34' }]
              : [],
          });
        }
        return new Response('User-agent: *\nDisallow: /private', {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }),
    );

    await expect(fetchPublicText('https://example.com')).rejects.toMatchObject({
      code: 'UNSUPPORTED_CONTENT',
    });

    const robots = await fetchPublicText('https://example.com/robots.txt', {
      accept: 'text/plain',
      allowedMediaTypes: ['text/plain'],
    });
    expect(robots.text).toContain('Disallow: /private');
    expect(robots.contentType).toContain('text/plain');
  });

  it('rejects non-text responses and non-success status pages', async () => {
    const dns = () =>
      Response.json({
        Status: 0,
        Answer: [{ type: 1, data: '93.184.216.34' }],
      });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) return dns();
        return new Response('binary', {
          headers: { 'content-type': 'application/octet-stream' },
        });
      }),
    );
    await expect(fetchPublicText('https://example.com')).rejects.toMatchObject({
      code: 'UNSUPPORTED_CONTENT',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) return dns();
        return new Response('not found', {
          status: 404,
          headers: { 'content-type': 'text/html' },
        });
      }),
    );
    await expect(fetchPublicText('https://example.com')).rejects.toMatchObject({
      code: 'UPSTREAM_FAILURE',
    });
  });

  it('requires an exact textual media type', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.startsWith('https://cloudflare-dns.com/')) {
          return Response.json({
            Status: 0,
            Answer: [{ type: 1, data: '93.184.216.34' }],
          });
        }
        return new Response('not really html', {
          headers: { 'content-type': 'text/html-malicious' },
        });
      }),
    );
    await expect(fetchPublicText('https://example.com')).rejects.toMatchObject({
      code: 'UNSUPPORTED_CONTENT',
    });
  });

  it('honors a signal that is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal('fetch', vi.fn());
    await expect(
      fetchPublicText('https://example.com', controller.signal),
    ).rejects.toMatchObject({
      code: 'UPSTREAM_TIMEOUT',
      status: 408,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
