import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

const raw = await readFile(indexPath, 'utf8');
const reports = JSON.parse(raw) as AdoptionReport[];
const latest = [...reports].sort((a, b) => b.date.localeCompare(a.date))[0];
if (!latest) throw new Error('At least one adoption report is required.');

const now = new Date();
const generatedAt = now.toISOString();
const date = pacificDate(now);
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
