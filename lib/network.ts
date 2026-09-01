import type { ScanErrorBody } from '@/lib/types';

export const MAX_RESPONSE_BYTES = 640_000;
export const MAX_REDIRECTS = 3;
export const FETCH_TIMEOUT_MS = 8_000;
export const TOTAL_SCAN_TIMEOUT_MS = 12_000;

type ScanErrorCode = ScanErrorBody['error']['code'];

export class ScanFailure extends Error {
  constructor(
    public readonly code: ScanErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'ScanFailure';
  }
}

function parseIpv4Part(part: string): number | null {
  if (!part) return null;
  const isHex = /^0x[0-9a-f]+$/i.test(part);
  const isOctal = /^0[0-7]+$/.test(part);
  const isDecimal = /^(?:0|[1-9][0-9]*)$/.test(part);
  if (!isHex && !isOctal && !isDecimal) return null;
  const radix = isHex ? 16 : isOctal ? 8 : 10;
  const value = Number.parseInt(part.replace(/^0x/i, ''), radix);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseIpv4(input: string): number[] | null {
  const parts = input.split('.');
  if (parts.length < 1 || parts.length > 4) return null;
  const values = parts.map(parseIpv4Part);
  if (values.some((value) => value === null)) return null;
  const nums = values as number[];

  let value: number;
  if (nums.length === 1) {
    value = nums[0];
  } else if (nums.length === 2 && nums[0] <= 0xff && nums[1] <= 0xffffff) {
    value = nums[0] * 2 ** 24 + nums[1];
  } else if (
    nums.length === 3 &&
    nums[0] <= 0xff &&
    nums[1] <= 0xff &&
    nums[2] <= 0xffff
  ) {
    value = nums[0] * 2 ** 24 + nums[1] * 2 ** 16 + nums[2];
  } else if (nums.length === 4 && nums.every((item) => item <= 0xff)) {
    return nums;
  } else {
    return null;
  }

  if (value > 0xffffffff) return null;
  return [
    Math.floor(value / 2 ** 24) & 0xff,
    Math.floor(value / 2 ** 16) & 0xff,
    Math.floor(value / 2 ** 8) & 0xff,
    value & 0xff,
  ];
}

function isPublicIpv4(parts: number[]): boolean {
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function expandIpv6(input: string): number[] | null {
  let value = input
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];
  const embeddedIpv4 = value.match(/(?:^|:)([0-9.]+)$/)?.[1];
  if (embeddedIpv4) {
    const ipv4 = parseIpv4(embeddedIpv4);
    if (!ipv4) return null;
    value =
      value.slice(0, -embeddedIpv4.length) +
      `${((ipv4[0] << 8) | ipv4[1]).toString(16)}:${((ipv4[2] << 8) | ipv4[3]).toString(16)}`;
  }

  const halves = value.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8) return null;
  const parsed = groups.map((group) =>
    /^[0-9a-f]{1,4}$/.test(group) ? Number.parseInt(group, 16) : Number.NaN,
  );
  return parsed.every(Number.isFinite) ? parsed : null;
}

function matchesIpv6Cidr(
  groups: number[],
  prefix: number[],
  prefixLength: number,
): boolean {
  const fullGroups = Math.floor(prefixLength / 16);
  const remainingBits = prefixLength % 16;
  for (let index = 0; index < fullGroups; index += 1) {
    if (groups[index] !== (prefix[index] ?? 0)) return false;
  }
  if (!remainingBits) return true;
  const mask = (0xffff << (16 - remainingBits)) & 0xffff;
  return (groups[fullGroups] & mask) === ((prefix[fullGroups] ?? 0) & mask);
}

// IANA IPv6 Global Unicast Address Space allocations, snapshot 2025-10-10.
// Unlisted 2000::/3 space is reserved for future allocation, so the scanner
// fails closed until this list is deliberately reviewed and updated.
const allocatedIpv6Unicast: Array<{
  prefix: number[];
  prefixLength: number;
}> = [
  { prefix: [0x2001, 0x0200], prefixLength: 23 },
  { prefix: [0x2001, 0x0400], prefixLength: 23 },
  { prefix: [0x2001, 0x0600], prefixLength: 23 },
  { prefix: [0x2001, 0x0800], prefixLength: 22 },
  { prefix: [0x2001, 0x0c00], prefixLength: 23 },
  { prefix: [0x2001, 0x0e00], prefixLength: 23 },
  { prefix: [0x2001, 0x1200], prefixLength: 23 },
  { prefix: [0x2001, 0x1400], prefixLength: 22 },
  { prefix: [0x2001, 0x1800], prefixLength: 23 },
  { prefix: [0x2001, 0x1a00], prefixLength: 23 },
  { prefix: [0x2001, 0x1c00], prefixLength: 22 },
  { prefix: [0x2001, 0x2000], prefixLength: 19 },
  { prefix: [0x2001, 0x4000], prefixLength: 23 },
  { prefix: [0x2001, 0x4200], prefixLength: 23 },
  { prefix: [0x2001, 0x4400], prefixLength: 23 },
  { prefix: [0x2001, 0x4600], prefixLength: 23 },
  { prefix: [0x2001, 0x4800], prefixLength: 23 },
  { prefix: [0x2001, 0x4a00], prefixLength: 23 },
  { prefix: [0x2001, 0x4c00], prefixLength: 23 },
  { prefix: [0x2001, 0x5000], prefixLength: 20 },
  { prefix: [0x2001, 0x8000], prefixLength: 19 },
  { prefix: [0x2001, 0xa000], prefixLength: 20 },
  { prefix: [0x2001, 0xb000], prefixLength: 20 },
  { prefix: [0x2003, 0], prefixLength: 18 },
  { prefix: [0x2400, 0], prefixLength: 12 },
  { prefix: [0x2410, 0], prefixLength: 12 },
  { prefix: [0x2600, 0], prefixLength: 12 },
  { prefix: [0x2610, 0], prefixLength: 23 },
  { prefix: [0x2620, 0], prefixLength: 23 },
  { prefix: [0x2630, 0], prefixLength: 12 },
  { prefix: [0x2800, 0], prefixLength: 12 },
  { prefix: [0x2a00, 0], prefixLength: 12 },
  { prefix: [0x2a10, 0], prefixLength: 12 },
  { prefix: [0x2c00, 0], prefixLength: 12 },
];

function isPublicIpv6(groups: number[]): boolean {
  if (groups.every((group) => group === 0)) return false;
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1)
    return false;

  if (
    groups.slice(0, 5).every((group) => group === 0) &&
    groups[5] === 0xffff
  ) {
    const ipv4 = [
      groups[6] >> 8,
      groups[6] & 0xff,
      groups[7] >> 8,
      groups[7] & 0xff,
    ];
    return isPublicIpv4(ipv4);
  }

  const first = groups[0];
  if ((first & 0xfe00) === 0xfc00) return false;
  if ((first & 0xffc0) === 0xfe80) return false;
  if ((first & 0xff00) === 0xff00) return false;
  if (matchesIpv6Cidr(groups, [0x2001, 0], 23)) return false;
  if (matchesIpv6Cidr(groups, [0x2001, 0x0db8], 32)) return false;
  if (matchesIpv6Cidr(groups, [0x2002], 16)) return false;
  if (matchesIpv6Cidr(groups, [0x3fff, 0], 20)) return false;

  return allocatedIpv6Unicast.some(({ prefix, prefixLength }) =>
    matchesIpv6Cidr(groups, prefix, prefixLength),
  );
}

export function isPublicIpAddress(input: string): boolean {
  const unwrapped = input.replace(/^\[|\]$/g, '');
  const ipv4 = parseIpv4(unwrapped);
  if (ipv4) return isPublicIpv4(ipv4);
  const ipv6 = expandIpv6(unwrapped);
  return ipv6 ? isPublicIpv6(ipv6) : false;
}

export function normalizePublicUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2_048) {
    throw new ScanFailure('INVALID_INPUT', 'Enter a valid public URL.');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ScanFailure(
      'INVALID_INPUT',
      'Enter an absolute HTTP or HTTPS URL.',
    );
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ScanFailure(
      'INVALID_INPUT',
      'Only HTTP and HTTPS URLs can be scanned.',
    );
  }
  if (url.username || url.password) {
    throw new ScanFailure(
      'UNSAFE_TARGET',
      'URLs containing credentials are not allowed.',
    );
  }
  if (
    url.port &&
    !(
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    )
  ) {
    throw new ScanFailure(
      'UNSAFE_TARGET',
      'Quick Scan only connects to standard HTTP and HTTPS ports.',
    );
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.home.arpa')
  ) {
    throw new ScanFailure(
      'UNSAFE_TARGET',
      'Local and private network targets are not allowed.',
    );
  }

  const appearsToBeIp = hostname.includes(':') || parseIpv4(hostname) !== null;
  if (appearsToBeIp && !isPublicIpAddress(hostname)) {
    throw new ScanFailure(
      'UNSAFE_TARGET',
      'Private, reserved, and special-purpose addresses are not allowed.',
    );
  }

  url.hash = '';
  return url;
}

interface DnsJson {
  Status?: number;
  Answer?: Array<{ type?: number; data?: string }>;
}

async function resolveRecord(
  hostname: string,
  type: 'A' | 'AAAA',
  signal?: AbortSignal,
): Promise<string[]> {
  const endpoint = new URL('https://cloudflare-dns.com/dns-query');
  endpoint.searchParams.set('name', hostname);
  endpoint.searchParams.set('type', type);
  const response = await fetch(endpoint, {
    headers: { accept: 'application/dns-json' },
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(3_500)])
      : AbortSignal.timeout(3_500),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as DnsJson;
  if (payload.Status !== 0) return [];
  const expectedType = type === 'A' ? 1 : 28;
  return (payload.Answer ?? [])
    .filter((answer) => answer.type === expectedType && answer.data)
    .map((answer) => answer.data as string);
}

export async function assertPublicResolution(
  hostname: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const direct = hostname.replace(/^\[|\]$/g, '');
  if (direct.includes(':') || parseIpv4(direct)) {
    if (!isPublicIpAddress(direct)) {
      throw new ScanFailure(
        'UNSAFE_TARGET',
        'The target resolved to a non-public address.',
      );
    }
    return [direct];
  }

  let addresses: string[];
  try {
    const [ipv4, ipv6] = await Promise.all([
      resolveRecord(direct, 'A', signal),
      resolveRecord(direct, 'AAAA', signal),
    ]);
    addresses = [...ipv4, ...ipv6];
  } catch {
    if (signal?.aborted) {
      throw new ScanFailure(
        'UPSTREAM_TIMEOUT',
        'The scan exceeded its total time limit.',
        504,
      );
    }
    throw new ScanFailure(
      'UPSTREAM_FAILURE',
      'The target hostname could not be verified.',
      502,
    );
  }

  if (!addresses.length) {
    throw new ScanFailure(
      'UPSTREAM_FAILURE',
      'The target hostname did not resolve to a public address.',
      502,
    );
  }
  if (addresses.some((address) => !isPublicIpAddress(address))) {
    throw new ScanFailure(
      'UNSAFE_TARGET',
      'The target resolved to a private or reserved address.',
    );
  }
  return addresses;
}

function textualContentType(contentType: string): boolean {
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
  return ['text/html', 'application/xhtml+xml', 'text/plain'].includes(
    mediaType,
  );
}

export interface SafeFetchResult {
  text: string;
  finalUrl: string;
  status: number;
  contentType: string;
  bytesRead: number;
  redirects: number;
}

async function readLimitedBody(
  response: Response,
): Promise<{ text: string; bytes: number }> {
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) {
    throw new ScanFailure(
      'RESPONSE_TOO_LARGE',
      'The page is larger than the Quick Scan safety limit.',
      413,
    );
  }
  if (!response.body) return { text: '', bytes: 0 };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new ScanFailure(
        'RESPONSE_TOO_LARGE',
        'The page is larger than the Quick Scan safety limit.',
        413,
      );
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    text: new TextDecoder('utf-8', { fatal: false }).decode(merged),
    bytes,
  };
}

export async function fetchPublicText(
  rawUrl: string,
  externalSignal?: AbortSignal,
  beforeHop?: (url: URL) => void,
): Promise<SafeFetchResult> {
  let current = normalizePublicUrl(rawUrl);
  const totalController = new AbortController();
  const cancelTotal = () => totalController.abort(externalSignal?.reason);
  if (externalSignal?.aborted) totalController.abort(externalSignal.reason);
  else externalSignal?.addEventListener('abort', cancelTotal, { once: true });
  const totalTimeout = setTimeout(
    () => totalController.abort(),
    TOTAL_SCAN_TIMEOUT_MS,
  );

  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      if (totalController.signal.aborted) {
        throw new ScanFailure(
          'UPSTREAM_TIMEOUT',
          externalSignal?.aborted
            ? 'The scan was cancelled.'
            : 'The scan exceeded its total time limit.',
          externalSignal?.aborted ? 408 : 504,
        );
      }
      beforeHop?.(new URL(current));
      await assertPublicResolution(current.hostname, totalController.signal);
      const controller = new AbortController();
      const cancelHop = () => controller.abort(totalController.signal.reason);
      totalController.signal.addEventListener('abort', cancelHop, {
        once: true,
      });
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let response: Response | undefined;
      try {
        response = await fetch(current, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            accept: 'text/html,application/xhtml+xml,text/plain;q=0.8',
            'user-agent':
              'isWebMCP-QuickScan/1.0 (+https://iswebmcp.com/methodology)',
          },
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location)
            throw new ScanFailure(
              'UPSTREAM_FAILURE',
              'The target returned an invalid redirect.',
              502,
            );
          if (redirects === MAX_REDIRECTS)
            throw new ScanFailure(
              'UPSTREAM_FAILURE',
              'The target exceeded the redirect limit.',
              502,
            );
          await response.body?.cancel();
          current = normalizePublicUrl(new URL(location, current).toString());
          continue;
        }
        if (!response.ok) {
          throw new ScanFailure(
            'UPSTREAM_FAILURE',
            `The target returned HTTP ${response.status}; error responses are not scored.`,
            422,
          );
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!textualContentType(contentType))
          throw new ScanFailure(
            'UNSUPPORTED_CONTENT',
            'Quick Scan accepts HTML and plain-text pages only.',
            415,
          );
        const body = await readLimitedBody(response);
        return {
          text: body.text,
          finalUrl: current.toString(),
          status: response.status,
          contentType,
          bytesRead: body.bytes,
          redirects,
        };
      } catch (error) {
        if (error instanceof ScanFailure) {
          if (response?.body && !response.bodyUsed)
            await response.body.cancel().catch(() => undefined);
          throw error;
        }
        if (controller.signal.aborted) {
          throw new ScanFailure(
            'UPSTREAM_TIMEOUT',
            externalSignal?.aborted
              ? 'The scan was cancelled.'
              : totalController.signal.aborted
                ? 'The scan exceeded its total time limit.'
                : 'The target did not respond within the per-request timeout.',
            externalSignal?.aborted ? 408 : 504,
          );
        }
        throw new ScanFailure(
          'UPSTREAM_FAILURE',
          'The public page could not be fetched safely.',
          502,
        );
      } finally {
        clearTimeout(timeout);
        totalController.signal.removeEventListener('abort', cancelHop);
      }
    }
    throw new ScanFailure(
      'UPSTREAM_FAILURE',
      'The page could not be fetched safely.',
      502,
    );
  } finally {
    clearTimeout(totalTimeout);
    externalSignal?.removeEventListener('abort', cancelTotal);
  }
}

export function toScanError(error: unknown): {
  body: ScanErrorBody;
  status: number;
} {
  if (error instanceof ScanFailure) {
    return {
      body: { error: { code: error.code, message: error.message } },
      status: error.status,
    };
  }
  return {
    body: {
      error: {
        code: 'UPSTREAM_FAILURE',
        message: 'The scan could not be completed safely. Try again shortly.',
      },
    },
    status: 500,
  };
}
