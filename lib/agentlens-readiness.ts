import {
  fetchPublicText,
  normalizePublicUrl,
  ScanFailure,
} from '@/lib/network';
import { acquireScanSlot, allowRequest } from '@/lib/scan-store';

export type ReadinessGroup =
  | 'Discoverability'
  | 'Readable content'
  | 'Crawler policy'
  | 'Agent protocols'
  | 'Commerce';

export type ReadinessStatus =
  | 'found'
  | 'not_found'
  | 'owner_choice'
  | 'could_not_verify'
  | 'optional';

export interface ReadinessCheck {
  id: string;
  group: ReadinessGroup;
  title: string;
  status: ReadinessStatus;
  maturity: 'established' | 'emerging' | 'optional';
  detail: string;
  recommendation: string;
  evidence?: {
    url: string;
    statusCode?: number;
    contentType?: string;
    excerpt?: string;
  };
}

export interface AgentReadinessReport {
  version: 'agentlens-readiness/v1';
  origin: string;
  scannedAt: string;
  durationMs: number;
  checks: ReadinessCheck[];
  summary: {
    found: number;
    notFound: number;
    ownerChoice: number;
    couldNotVerify: number;
    optional: number;
  };
  scope: string;
}

interface Probe {
  id: string;
  url: URL;
  accept?: string;
  group: ReadinessGroup;
  title: string;
  maturity: ReadinessCheck['maturity'];
  recommendation: string;
}

const allowedMediaTypes = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/xhtml+xml',
  'application/json',
  'application/ld+json',
  'application/xml',
  'text/xml',
];

function sameOriginProbe(probeUrl: URL, origin: string) {
  if (probeUrl.origin !== origin) {
    throw new ScanFailure(
      'UNSAFE_TARGET',
      'Readiness checks stay on the submitted site origin.',
    );
  }
  return probeUrl;
}

function cleanEvidenceUrl(value: string): string {
  const url = new URL(value);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function shortExcerpt(value: string, max = 200): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function statusForProbe(status: number, optional: boolean): ReadinessStatus {
  if (status >= 200 && status < 300) return 'found';
  if (status === 404 || status === 410)
    return optional ? 'optional' : 'not_found';
  if (status === 401 || status === 403) return 'owner_choice';
  return 'could_not_verify';
}

function checkForProbe(
  probe: Probe,
  result: Awaited<ReturnType<typeof fetchPublicText>> | null,
  optional = probe.maturity === 'optional' || probe.maturity === 'emerging',
): ReadinessCheck {
  if (!result) {
    return {
      id: probe.id,
      group: probe.group,
      title: probe.title,
      status: 'could_not_verify',
      maturity: probe.maturity,
      detail:
        'The site did not provide a response that AgentLens could verify safely.',
      recommendation: probe.recommendation,
      evidence: { url: cleanEvidenceUrl(probe.url.toString()) },
    };
  }
  const contentType = result.contentType?.split(';', 1)[0]?.trim();
  let status = statusForProbe(result.status, optional);
  const expectedJson = [
    'agent-skills',
    'mcp-server-card',
    'a2a-agent-card',
    'api-catalog',
    'oauth-resource',
    'web-bot-auth',
    'ucp',
    'acp',
  ].includes(probe.id);
  const expectedMarkdown = ['index-markdown', 'markdown-negotiation'].includes(
    probe.id,
  );
  const expectedPlainText = probe.id === 'llms-txt';
  const validRobots =
    probe.id !== 'robots' ||
    (contentType === 'text/plain' && /^\s*User-agent\s*:/im.test(result.text));
  const validSitemap =
    probe.id !== 'sitemap' ||
    ((contentType === 'application/xml' || contentType === 'text/xml') &&
      /<(?:urlset|sitemapindex)\b/i.test(result.text));
  const validJson =
    !expectedJson ||
    Boolean(
      contentType &&
      (contentType.includes('json') ||
        contentType === 'application/xml' ||
        contentType === 'text/xml'),
    );
  const validMarkdown = !expectedMarkdown || contentType === 'text/markdown';
  const validPlainText =
    !expectedPlainText ||
    (contentType === 'text/plain' &&
      !/^\s*<(?:!doctype|html)\b/i.test(result.text));
  if (
    status === 'found' &&
    !(
      validRobots &&
      validSitemap &&
      validJson &&
      validMarkdown &&
      validPlainText
    )
  ) {
    status = 'could_not_verify';
  }
  const detail =
    status === 'found'
      ? `Public endpoint responded with HTTP ${result.status}${contentType ? ` (${contentType})` : ''}. Presence is detected; the endpoint's full behavior is not validated.`
      : status === 'owner_choice'
        ? `The site returned HTTP ${result.status}. Access may be intentionally restricted.`
        : status === 'optional'
          ? 'No response was found at this conventional path. This capability is optional and may use another discovery route.'
          : status === 'not_found'
            ? `No endpoint was found at this conventional path (HTTP ${result.status}).`
            : `The site returned HTTP ${result.status}${contentType ? ` (${contentType})` : ''}; the response did not match the expected ${expectedMarkdown ? 'Markdown representation' : expectedJson ? 'JSON metadata' : probe.id === 'robots' ? 'robots directive format' : probe.id === 'sitemap' ? 'sitemap format' : 'plain-text guide'}.`;
  return {
    id: probe.id,
    group: probe.group,
    title: probe.title,
    status,
    maturity: probe.maturity,
    detail,
    recommendation: probe.recommendation,
    evidence: {
      url: cleanEvidenceUrl(probe.url.toString()),
      statusCode: result.status,
      contentType,
    },
  };
}

async function safelyFetch(probe: Probe, origin: string, host: string) {
  try {
    return await fetchPublicText(probe.url.toString(), {
      userAgent: 'AgentLens-Readiness/1.0 (+https://iswebmcp.com/agentlens)',
      accept:
        probe.accept ??
        'text/plain,application/json,application/xml;q=0.9,*/*;q=0.1',
      allowedMediaTypes,
      returnErrorResponse: true,
      maxResponseBytes: 24_000,
      timeoutMs: 3_000,
      totalTimeoutMs: 4_500,
      beforeHop: (hop) => {
        sameOriginProbe(hop, origin);
        if (!allowRequest(`agentlens-readiness-host:${host}`, 120)) {
          throw new ScanFailure(
            'RATE_LIMITED',
            'This site is receiving too many readiness checks. Try again shortly.',
            429,
          );
        }
      },
    });
  } catch {
    return null;
  }
}

function getHeaderChecks(
  rootProbe: Probe,
  root: Awaited<ReturnType<typeof fetchPublicText>> | null,
  robotsProbe: Probe,
  robots: Awaited<ReturnType<typeof fetchPublicText>> | null,
): ReadinessCheck[] {
  const headerEvidence = root?.headers ?? {};
  const link = headerEvidence.link ?? '';
  const contentSignal = headerEvidence['content-signal'] ?? '';
  const robotsText =
    robots?.contentType.split(';', 1)[0]?.trim() === 'text/plain'
      ? robots.text
      : '';
  const aiDirective = robotsText.match(
    /^\s*User-agent\s*:\s*(?:GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-SearchBot|Claude-User|Google-Extended|Applebot-Extended|PerplexityBot|Bytespider|Amazonbot|CCBot|anthropic-ai|cohere-ai)\s*\r?\n(?:[^\n]*\n?){0,8}/gim,
  );
  const signalFromRobots = robotsText.match(/^\s*Content-Signal\s*:.+$/im)?.[0];
  const sitemapPointer = robotsText.match(/^\s*Sitemap\s*:\s*\S+\s*$/im)?.[0];
  const linkHasCatalog = /rel\s*=\s*["']?[^"';,]*api-catalog/i.test(link);
  const robotsAccessible = Boolean(
    robots &&
    robots.status >= 200 &&
    robots.status < 300 &&
    robots.contentType.split(';', 1)[0]?.trim() === 'text/plain' &&
    /^\s*User-agent\s*:/im.test(robots.text),
  );
  const rootAccessible = Boolean(
    root && root.status >= 200 && root.status < 300,
  );
  const checks: ReadinessCheck[] = [
    {
      id: 'sitemap-reference',
      group: 'Discoverability',
      title: 'Sitemap pointer in robots.txt',
      status: sitemapPointer
        ? 'found'
        : robotsAccessible
          ? 'optional'
          : 'could_not_verify',
      maturity: 'established',
      detail: sitemapPointer
        ? `Found a sitemap pointer in robots.txt: ${shortExcerpt(sitemapPointer, 180)}. The pointer target was not fetched separately.`
        : robotsAccessible
          ? 'No sitemap pointer was found in robots.txt. A sitemap may still be discoverable elsewhere.'
          : 'AgentLens could not inspect a readable robots.txt for a sitemap pointer.',
      recommendation:
        'If you maintain a sitemap, reference its canonical URL from robots.txt.',
      evidence: robots
        ? {
            url: cleanEvidenceUrl(robotsProbe.url.toString()),
            statusCode: robots.status,
            excerpt: sitemapPointer
              ? shortExcerpt(sitemapPointer, 180)
              : undefined,
          }
        : { url: cleanEvidenceUrl(robotsProbe.url.toString()) },
    },
    {
      id: 'ai-crawler-policy',
      group: 'Crawler policy',
      title: 'AI crawler directives',
      status: aiDirective
        ? 'found'
        : robotsAccessible
          ? 'owner_choice'
          : 'could_not_verify',
      maturity: 'established',
      detail: aiDirective
        ? `Found crawler-specific robots.txt rules: ${shortExcerpt(aiDirective.join(' '), 180)}`
        : robotsAccessible
          ? 'No explicit rule for the recognized AI crawlers was found. A missing rule does not mean allowed or blocked; the policy is yours to choose.'
          : 'AgentLens could not confirm a readable robots.txt policy, so it cannot infer crawler access.',
      recommendation:
        'Review crawler access intentionally. Document the user agents and paths your organization wants to allow or disallow.',
      evidence: robots
        ? {
            url: cleanEvidenceUrl(robotsProbe.url.toString()),
            statusCode: robots.status,
            excerpt: aiDirective
              ? shortExcerpt(aiDirective.join(' '), 180)
              : undefined,
          }
        : { url: cleanEvidenceUrl(robotsProbe.url.toString()) },
    },
    {
      id: 'content-signals',
      group: 'Crawler policy',
      title: 'Content Signals',
      status:
        contentSignal || signalFromRobots
          ? 'found'
          : rootAccessible || robotsAccessible
            ? 'owner_choice'
            : 'could_not_verify',
      maturity: 'emerging',
      detail:
        contentSignal || signalFromRobots
          ? `Found a Content-Signal declaration: ${shortExcerpt(contentSignal || signalFromRobots!, 180)}`
          : rootAccessible || robotsAccessible
            ? 'No Content-Signal declaration was observed in the homepage response headers or robots.txt. This is an emerging policy choice, not a universal requirement.'
            : 'AgentLens could not inspect the homepage headers or robots.txt for Content Signals.',
      recommendation:
        'If you adopt Content Signals, publish a policy that reflects your licensing and reuse choices.',
      evidence: contentSignal
        ? {
            url: cleanEvidenceUrl(rootProbe.url.toString()),
            statusCode: root?.status,
            excerpt: shortExcerpt(contentSignal, 180),
          }
        : robots && signalFromRobots
          ? {
              url: cleanEvidenceUrl(robotsProbe.url.toString()),
              statusCode: robots.status,
              excerpt: shortExcerpt(signalFromRobots, 180),
            }
          : {
              url: cleanEvidenceUrl(rootProbe.url.toString()),
              statusCode: root?.status,
            },
    },
    {
      id: 'api-catalog-link',
      group: 'Discoverability',
      title: 'API Catalog link relation',
      status: linkHasCatalog
        ? 'found'
        : rootAccessible
          ? 'optional'
          : 'could_not_verify',
      maturity: 'optional',
      detail: linkHasCatalog
        ? `Found an API Catalog relation in the Link response header: ${shortExcerpt(link, 180)}`
        : rootAccessible
          ? 'No API Catalog Link relation was observed on the homepage. Publishing a catalog is optional; a catalog may be discoverable elsewhere.'
          : 'AgentLens could not inspect the homepage Link header.',
      recommendation:
        'If you publish APIs for agent use, consider linking a maintained catalog from the response Link header.',
      evidence: {
        url: cleanEvidenceUrl(rootProbe.url.toString()),
        statusCode: root?.status,
        excerpt: link ? shortExcerpt(link, 180) : undefined,
      },
    },
  ];
  return checks;
}

/**
 * Bounded, same-origin, public GET checks. This reports endpoint presence and
 * owner choices; it does not crawl links, execute pages, or award a score.
 */
export async function runAgentReadinessAudit(
  rawUrl: string,
): Promise<AgentReadinessReport> {
  const startedAt = Date.now();
  const target = normalizePublicUrl(rawUrl);
  const origin = target.origin;
  const host = target.hostname.toLowerCase().replace(/\.$/, '');
  const releaseSlot = acquireScanSlot(6);
  if (!releaseSlot) {
    throw new ScanFailure(
      'RATE_LIMITED',
      'The scanner is at its safe concurrency limit. Try again shortly.',
      503,
    );
  }

  const markdownPath = target.pathname.endsWith('/')
    ? `${target.pathname}index.md`
    : `${target.pathname}.md`;
  const rootProbe: Probe = {
    id: 'homepage',
    url: new URL('/', origin),
    group: 'Discoverability',
    title: 'Homepage discovery headers',
    maturity: 'established',
    recommendation:
      'Keep canonical navigation and discovery metadata available on the public homepage.',
    accept: 'text/html,application/xhtml+xml',
  };
  const robotsProbe: Probe = {
    id: 'robots',
    url: new URL('/robots.txt', origin),
    group: 'Discoverability',
    title: 'Robots.txt',
    maturity: 'established',
    recommendation:
      'Publish robots.txt if you need a clear, machine-readable crawler policy or sitemap pointer.',
  };
  const probes: Probe[] = [
    rootProbe,
    robotsProbe,
    {
      id: 'sitemap',
      url: new URL('/sitemap.xml', origin),
      group: 'Discoverability',
      title: 'Sitemap',
      maturity: 'established',
      recommendation:
        'Publish a sitemap and reference it in robots.txt to make public URLs easier to discover.',
    },
    {
      id: 'llms-txt',
      url: new URL('/llms.txt', origin),
      group: 'Readable content',
      title: 'llms.txt guide',
      maturity: 'emerging',
      recommendation:
        'If useful to your audience, publish a short, curated llms.txt with links to canonical docs; keep it maintained.',
    },
    {
      id: 'index-markdown',
      url: new URL(markdownPath, origin),
      group: 'Readable content',
      title: 'Markdown page alternative',
      maturity: 'emerging',
      recommendation:
        'Consider a concise Markdown representation for documentation pages that should work well in text-first clients.',
    },
    {
      id: 'markdown-negotiation',
      url: new URL('/', origin),
      group: 'Readable content',
      title: 'Markdown content negotiation',
      maturity: 'emerging',
      recommendation:
        'If you support text-first clients, consider returning Markdown when requested with Accept: text/markdown.',
      accept: 'text/markdown',
    },
    {
      id: 'agent-skills',
      url: new URL('/.well-known/agent-skills/index.json', origin),
      group: 'Agent protocols',
      title: 'Agent Skills index',
      maturity: 'emerging',
      recommendation:
        'If you publish reusable agent workflows, expose a maintained Skills index with descriptions and direct skill URLs.',
    },
    {
      id: 'mcp-server-card',
      url: new URL('/.well-known/mcp/server-card.json', origin),
      group: 'Agent protocols',
      title: 'MCP Server Card',
      maturity: 'emerging',
      recommendation:
        'If you operate an MCP server, publish its discovery metadata using the current proposal and label draft support clearly.',
    },
    {
      id: 'a2a-agent-card',
      url: new URL('/.well-known/agent-card.json', origin),
      group: 'Agent protocols',
      title: 'A2A Agent Card',
      maturity: 'optional',
      recommendation:
        'If you expose an A2A agent, publish its Agent Card at the standard discovery path and keep capabilities accurate.',
    },
    {
      id: 'api-catalog',
      url: new URL('/.well-known/api-catalog', origin),
      group: 'Agent protocols',
      title: 'API Catalog endpoint',
      maturity: 'optional',
      recommendation:
        'If you publish APIs, consider providing a catalog at the registered well-known path and link to it from your site.',
    },
    {
      id: 'oauth-resource',
      url: new URL('/.well-known/oauth-protected-resource', origin),
      group: 'Agent protocols',
      title: 'OAuth Protected Resource metadata',
      maturity: 'optional',
      recommendation:
        'If an API uses OAuth protected-resource discovery, publish metadata for the exact protected resource URI.',
    },
    {
      id: 'web-bot-auth',
      url: new URL('/.well-known/http-message-signatures-directory', origin),
      group: 'Agent protocols',
      title: 'HTTP Message Signatures directory',
      maturity: 'emerging',
      recommendation:
        'Only adopt signed bot identity when you have a server-side verification policy and a tested key rotation plan.',
    },
    {
      id: 'ucp',
      url: new URL('/.well-known/ucp', origin),
      group: 'Commerce',
      title: 'Universal Commerce Protocol discovery',
      maturity: 'emerging',
      recommendation:
        'If agent-mediated commerce fits your business, review UCP discovery and publish only capabilities your checkout can safely honor.',
    },
    {
      id: 'acp',
      url: new URL('/.well-known/acp.json', origin),
      group: 'Commerce',
      title: 'Agentic Commerce Protocol discovery',
      maturity: 'emerging',
      recommendation:
        'If agent-mediated commerce fits your business, review ACP discovery and keep offers, policies, and transaction boundaries accurate.',
    },
  ];

  try {
    const results = new Map<
      string,
      Awaited<ReturnType<typeof fetchPublicText>> | null
    >();
    let nextProbe = 0;
    const workers = Array.from({ length: 4 }, async () => {
      while (nextProbe < probes.length) {
        const index = nextProbe++;
        const probe = probes[index]!;
        results.set(probe.id, await safelyFetch(probe, origin, host));
      }
    });
    await Promise.all(workers);

    const checks = probes.map((probe) =>
      checkForProbe(probe, results.get(probe.id) ?? null),
    );
    const root = results.get('homepage') ?? null;
    const robots = results.get('robots') ?? null;
    checks.push(...getHeaderChecks(rootProbe, root, robotsProbe, robots));
    const counts = {
      found: checks.filter((check) => check.status === 'found').length,
      notFound: checks.filter((check) => check.status === 'not_found').length,
      ownerChoice: checks.filter((check) => check.status === 'owner_choice')
        .length,
      couldNotVerify: checks.filter(
        (check) => check.status === 'could_not_verify',
      ).length,
      optional: checks.filter((check) => check.status === 'optional').length,
    };
    return {
      version: 'agentlens-readiness/v1',
      origin,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      checks,
      summary: counts,
      scope:
        'Public GET requests to 14 conventional same-origin endpoints, plus homepage and discovery headers. No page execution, link crawling, authenticated access, or global readiness score.',
    };
  } finally {
    releaseSlot();
  }
}
