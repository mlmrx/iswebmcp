const DEFAULT_SITE_ORIGIN = 'https://iswebmcp.com';

interface SiteEnvironment {
  SITE_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}

function normalizeOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveSiteOrigin(environment: SiteEnvironment): string {
  return (
    normalizeOrigin(environment.SITE_URL) ??
    normalizeOrigin(environment.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(environment.VERCEL_PROJECT_PRODUCTION_URL) ??
    DEFAULT_SITE_ORIGIN
  );
}

export const siteOrigin = resolveSiteOrigin({
  SITE_URL: process.env.SITE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});
