function firstForwardedValue(value: string | null): string | null {
  const first = value?.split(',', 1)[0]?.trim();
  return first || null;
}

function toOrigin(protocol: string, authority: string): string | null {
  try {
    return new URL(`${protocol}//${authority}`).origin;
  } catch {
    return null;
  }
}

/**
 * Detect cross-site browser mutations while tolerating a trusted reverse proxy
 * whose public Host differs from the server's internal request URL.
 */
export function isCrossSiteMutation(request: Request): boolean {
  if (request.headers.get('sec-fetch-site')?.toLowerCase() === 'cross-site') {
    return true;
  }

  const suppliedOrigin = request.headers.get('origin');
  if (!suppliedOrigin) return false;

  let normalizedOrigin: string;
  let requestUrl: URL;
  try {
    const parsedOrigin = new URL(suppliedOrigin);
    if (!['http:', 'https:'].includes(parsedOrigin.protocol)) return true;
    normalizedOrigin = parsedOrigin.origin;
    requestUrl = new URL(request.url);
  } catch {
    return true;
  }

  const allowedOrigins = new Set([requestUrl.origin]);
  const forwardedProtocol = firstForwardedValue(
    request.headers.get('x-forwarded-proto'),
  );
  const protocols = new Set([requestUrl.protocol]);
  if (forwardedProtocol && /^(?:http|https)$/i.test(forwardedProtocol)) {
    protocols.add(`${forwardedProtocol.toLowerCase()}:`);
  }

  const authorities = [
    firstForwardedValue(request.headers.get('host')),
    firstForwardedValue(request.headers.get('x-forwarded-host')),
  ].filter((value): value is string => Boolean(value));

  for (const protocol of protocols) {
    for (const authority of authorities) {
      const candidate = toOrigin(protocol, authority);
      if (candidate) allowedOrigins.add(candidate);
    }
  }

  return !allowedOrigins.has(normalizedOrigin);
}
