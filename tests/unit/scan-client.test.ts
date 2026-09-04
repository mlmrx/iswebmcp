import { describe, expect, it } from 'vitest';

import {
  normalizeScanUrlInput,
  parseScanApiResponse,
  ScanClientError,
} from '@/lib/scan-client';

describe('scan client URL normalization', () => {
  it.each([
    ['amazon.com', 'https://amazon.com/'],
    [
      'www.amazon.com/products?q=headsets',
      'https://www.amazon.com/products?q=headsets',
    ],
    ['//example.com/path', 'https://example.com/path'],
    ['example.com:443/path', 'https://example.com/path'],
    ['http://example.com/path', 'http://example.com/path'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeScanUrlInput(input)).toBe(expected);
  });

  it.each(['', 'mailto:test@example.com', 'javascript:alert(1)'])(
    'rejects non-website input %s',
    (input) => {
      expect(() => normalizeScanUrlInput(input)).toThrow(ScanClientError);
    },
  );

  it.each([
    'http://127.0.0.1/admin',
    'https://localhost/dashboard',
    'https://192.168.1.10/',
    'https://user:secret@example.com/',
    'https://example.com:8443/',
  ])(
    'rejects an obviously unsafe target before making a request: %s',
    (input) => {
      expect(() => normalizeScanUrlInput(input)).toThrow(ScanClientError);
    },
  );
});

describe('scan API response parsing', () => {
  it('accepts a minimally well-formed report envelope', async () => {
    const report = {
      id: 'scan_123',
      status: 'complete',
      normalizedUrl: 'https://example.com/',
      response: {},
      baselineActionability: {},
    };
    await expect(
      parseScanApiResponse(Response.json(report, { status: 201 })),
    ).resolves.toMatchObject(report);
  });

  it('turns a target denial into an actionable safe error', async () => {
    const response = Response.json(
      {
        error: {
          code: 'UPSTREAM_FAILURE',
          message:
            'The target returned HTTP 403; error responses are not scored.',
        },
      },
      { status: 422 },
    );
    await expect(parseScanApiResponse(response)).rejects.toMatchObject({
      code: 'UPSTREAM_FAILURE',
      stage: 'response',
      retryable: true,
      message: expect.stringMatching(/declined automated source access/i),
    });
  });

  it('never exposes raw HTML or JSON parser errors from a proxy response', async () => {
    const response = new Response(
      '<html><script>secretDebugPayload()</script><h1>Bad gateway</h1></html>',
      { status: 502, headers: { 'content-type': 'text/html' } },
    );
    let caught: unknown;
    try {
      await parseScanApiResponse(response);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ScanClientError);
    expect((caught as Error).message).toMatch(/retry/i);
    expect((caught as Error).message).not.toMatch(
      /secretDebugPayload|Unexpected token|<html>/i,
    );
  });

  it('rejects a successful but incomplete report response', async () => {
    await expect(
      parseScanApiResponse(Response.json({ ok: true })),
    ).rejects.toMatchObject({
      code: 'UPSTREAM_FAILURE',
      stage: 'response',
      retryable: true,
    });
  });
});
