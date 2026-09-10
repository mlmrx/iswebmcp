import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { AdoptionCensus } from '../../lib/adoption-census';
import type { AdoptionFinding, AdoptionReport } from '../../lib/adoption';

const root = process.cwd();
const indexPath = path.join(root, 'content', 'adoption', 'index.json');
const reportsDirectory = path.join(root, 'content', 'adoption', 'reports');
const USER_AGENT =
  'isWebMCP-Adoption-Research/1.0 (+https://iswebmcp.com/adoption; research@iswebmcp.com)';

interface Probe {
  slug: string;
  url?: string;
  localPath?: string;
  required: string[];
}

interface ProbeResult {
  slug: string;
  status: 'confirmed' | 'failed';
  checkedAt: string;
  note: string;
}

const probes: Probe[] = [
  {
    slug: 'cloudflare',
    url: 'https://www.cloudflare.com/',
    required: ['id="webmcp"', 'read_llms_txt', 'read_markdown_page'],
  },
  {
    slug: 'render',
    url: 'https://render.com/',
    required: [
      'navigator.modelContext',
      'render.docs.search',
      'render.docs.get-markdown',
      'render.llms.get-index',
      'render.blog.get-index',
      'render.articles.get-index',
    ],
  },
  {
    slug: 'apis-io',
    url: 'https://apis.io/',
    required: ['document.modelContext', 'search_apis', 'describe_network'],
  },
  {
    slug: 'zapier',
    url: 'https://zapier.com/',
    required: ['data-webmcp-origin-trial'],
  },
  {
    slug: 'nylas',
    url: 'https://www.nylas.com/',
    required: ['mcp-to-angie-connector'],
  },
  {
    slug: 'iswebmcp',
    localPath: path.join(root, 'components', 'app-provider.tsx'),
    required: [
      "name: 'scan_public_url'",
      "name: 'get_webmcp_adoption_report'",
      "name: 'list_webmcp_adopters'",
      "name: 'add_demo_product_to_cart'",
    ],
  },
];

function pacificDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function longDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(`${date}T12:00:00-07:00`));
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/javascript;q=0.9,text/plain;q=0.8',
        'user-agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.text()).slice(0, 2_000_000);
  } finally {
    clearTimeout(timeout);
  }
}

async function runProbe(probe: Probe, checkedAt: string): Promise<ProbeResult> {
  try {
    const source = probe.localPath
      ? await readFile(probe.localPath, 'utf8')
      : await fetchText(probe.url as string);
    const missing = probe.required.filter((needle) => !source.includes(needle));
    return {
      slug: probe.slug,
      status: missing.length ? 'failed' : 'confirmed',
      checkedAt,
      note: missing.length
        ? `Recheck did not recover: ${missing.join(', ')}.`
        : `All ${probe.required.length} expected source signals were recovered.`,
    };
  } catch (error) {
    return {
      slug: probe.slug,
      status: 'failed',
      checkedAt,
      note: `Recheck unavailable: ${error instanceof Error ? error.message : 'unknown error'}.`,
    };
  }
}

function stableFingerprint(report: AdoptionReport): string {
  return JSON.stringify({
    summary: report.summary,
    census: report.census
      ? {
          scope: report.census.scope,
          source: report.census.source,
          scheduledCount: report.census.scheduledCount,
          attemptedCount: report.census.attemptedCount,
          detectedCount: report.census.detectedCount,
          notDetectedCount: report.census.notDetectedCount,
          robotsBlockedCount: report.census.robotsBlockedCount,
          unreachableCount: report.census.unreachableCount,
          unsupportedCount: report.census.unsupportedCount,
          documentSurfaceCount: report.census.documentSurfaceCount,
          navigatorSurfaceCount: report.census.navigatorSurfaceCount,
          bridgeSurfaceCount: report.census.bridgeSurfaceCount,
          namedToolDefinitions: report.census.namedToolDefinitions,
          auditDigest: report.census.auditDigest,
          detections: report.census.detections.map((detection) => ({
            popularityRank: detection.popularityRank,
            domain: detection.domain,
            url: detection.url,
            finalUrl: detection.finalUrl,
            state: detection.state,
            surface: detection.surface,
            signals: detection.signals,
            tools: detection.tools,
          })),
        }
      : null,
    analysis: report.analysis,
    findings: report.findings.map((finding) => ({
      slug: finding.slug,
      organization: finding.organization,
      implementation: finding.implementation,
      attribution: finding.attribution,
      evidenceLevel: finding.evidenceLevel,
      surface: finding.surface,
      surfaceStatus: finding.surfaceStatus,
      deploymentCount: finding.deploymentCount,
      tools: finding.tools,
      sources: finding.sources,
      limitations: finding.limitations,
    })),
  });
}

function updateFinding(
  finding: AdoptionFinding,
  result: ProbeResult | undefined,
): AdoptionFinding & { dailyRecheck?: ProbeResult } {
  if (!result) return { ...finding };
  return {
    ...finding,
    observedAt:
      result.status === 'confirmed' ? result.checkedAt : finding.observedAt,
    dailyRecheck: result,
  };
}

function censusSummary(census: AdoptionCensus, date: string) {
  return {
    scope: census.scope,
    generatedAt: census.generatedAt,
    source: census.source,
    scheduledCount: census.coverage.scheduledCount,
    attemptedCount: census.coverage.attemptedCount,
    detectedCount: census.coverage.detectedCount,
    notDetectedCount: census.coverage.notDetectedCount,
    robotsBlockedCount: census.coverage.robotsBlockedCount,
    unreachableCount: census.coverage.unreachableCount,
    unsupportedCount: census.coverage.unsupportedCount,
    documentSurfaceCount: census.coverage.documentSurfaceCount,
    navigatorSurfaceCount: census.coverage.navigatorSurfaceCount,
    bridgeSurfaceCount: census.coverage.bridgeSurfaceCount,
    namedToolDefinitions: census.coverage.namedToolDefinitions,
    auditDigest: census.auditDigest,
    dataUrl: `/data/adoption-census/${date}.json`,
    detections: census.detections,
  };
}

const raw = await readFile(indexPath, 'utf8');
const reports = JSON.parse(raw) as AdoptionReport[];
const latest = [...reports].sort((a, b) => b.date.localeCompare(a.date))[0];
if (!latest) throw new Error('At least one adoption report is required.');

const now = new Date();
const generatedAt = now.toISOString();
const date = pacificDate(now);
const censusPath = path.join(
  root,
  'public',
  'data',
  'adoption-census',
  `${date}.json`,
);
const census = await readFile(censusPath, 'utf8')
  .then((value) => JSON.parse(value) as AdoptionCensus)
  .catch(() => undefined);
const results = await Promise.all(
  probes.map((probe) => runProbe(probe, generatedAt)),
);
const resultBySlug = new Map(results.map((result) => [result.slug, result]));
const report = structuredClone(latest) as AdoptionReport & {
  collection?: { checked: number; confirmed: number; failed: number };
};
report.date = date;
report.generatedAt = generatedAt;
report.title = `WebMCP Adoption Report — ${longDate(date)}`;
report.previousReportDate =
  latest.date === date ? latest.previousReportDate : latest.date;
report.findings = report.findings.map((finding) =>
  updateFinding(finding, resultBySlug.get(finding.slug)),
);
if (census) {
  report.census = censusSummary(census, date);
  report.analysis = [
    {
      heading: 'Top-10,000 coverage sets the denominator',
      body: `The first-pass Tranco census scheduled ${census.coverage.scheduledCount.toLocaleString()} domains and recorded ${census.coverage.attemptedCount.toLocaleString()} collection outcomes. It found ${census.coverage.detectedCount.toLocaleString()} positive WebMCP source signals; ${census.coverage.notDetectedCount.toLocaleString()} domains had no detected signal, while ${census.coverage.robotsBlockedCount.toLocaleString()} were blocked by robots policy and ${census.coverage.unreachableCount.toLocaleString()} were unreachable or timed out.`,
    },
    ...report.analysis.filter(
      (item) => item.heading !== 'Top-10,000 coverage sets the denominator',
    ),
  ];
  report.dek = `A daily first-pass census checks the Tranco top ${census.coverage.scheduledCount.toLocaleString()} public domains for source-level WebMCP signals, then separates those detections from directly inspected implementation records.`;
  report.methodology.scope = `Public WebMCP browser-tool adoption, including a robots-aware source census of the Tranco top ${census.coverage.scheduledCount.toLocaleString()} domains. Remote MCP servers are excluded unless a page bridges them into document.modelContext or the legacy navigator surface.`;
  report.methodology.collectionNotes = [
    ...report.methodology.collectionNotes.filter(
      (note) => !note.startsWith('The daily first-pass census'),
    ),
    `The daily first-pass census checks the Tranco top ${census.coverage.scheduledCount.toLocaleString()} domains, records every collection outcome, and retains only positive WebMCP detections in the downloadable ledger.`,
    `The census audit digest is ${census.auditDigest}; the list source and positive detections are linked from the dated report.`,
  ];
} else {
  delete report.census;
}
report.summary.namedToolDefinitions = report.findings.reduce(
  (total, finding) => total + finding.tools.length,
  0,
);
report.summary.organizationsNamed = report.findings.length;
report.summary.directlyInspectedOrganizations = report.findings.filter(
  (finding) =>
    ['source-confirmed', 'runtime-verified'].includes(finding.evidenceLevel),
).length;
const confirmed = results.filter(
  (result) => result.status === 'confirmed',
).length;
report.collection = {
  checked: results.length,
  confirmed,
  failed: results.length - confirmed,
};

const previousFingerprint = stableFingerprint(latest);
const nextFingerprint = stableFingerprint(report);
const failures = results.filter((result) => result.status === 'failed');
report.changeSummary =
  previousFingerprint === nextFingerprint
    ? failures.length
      ? `No material implementation change identified; ${failures.length} scheduled source recheck${failures.length === 1 ? '' : 's'} could not reproduce every expected signal.`
      : 'No material implementation change identified; all scheduled source rechecks reproduced their expected signals.'
    : 'The implementation ledger changed; review the dated finding records and evidence trails for details.';

const nextReports = reports.filter((item) => item.date !== date);
nextReports.push(report);
nextReports.sort((a, b) => b.date.localeCompare(a.date));
const formattedReport = `${JSON.stringify(report, null, 2)}\n`;
await writeFile(
  path.join(reportsDirectory, `${date}.json`),
  formattedReport,
  'utf8',
);
await writeFile(indexPath, `${JSON.stringify(nextReports, null, 2)}\n`, 'utf8');

console.log(
  `Published ${date}: ${confirmed}/${results.length} source rechecks confirmed; ${report.summary.namedToolDefinitions} named tools.`,
);
