import type { Metadata } from 'next';
import {
  ArrowRight,
  CircleAlert,
  Database,
  RadioTower,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

import { latestAdoptionReport } from '@/lib/adoption';
import {
  compareDirectoryWithCensus,
  webMcpDirectory,
  webMcpDirectoryHistory,
} from '@/lib/adoption-directory';
import { siteOrigin } from '@/lib/site-origin';

export const metadata: Metadata = {
  title: 'WebMCP adoption research methodology',
  description:
    'Counting units, evidence levels, collection boundaries, reconciliation rules, failure modes, and reproducibility for isWebMCP adoption research.',
  alternates: { canonical: '/adoption/methodology' },
  openGraph: {
    title: 'WebMCP adoption research methodology · isWebMCP',
    description:
      'How isWebMCP measures prevalence, implementation evidence, directory coverage, and runtime behavior without mixing the claims.',
    type: 'article',
    url: '/adoption/methodology',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP adoption research methodology',
      },
    ],
  },
};

const failureModes = [
  {
    name: 'Source false negative',
    cause:
      'Registration is injected after page load, hidden behind consent, served on a non-homepage route, or assembled from a script the bounded crawl does not execute.',
    treatment:
      'Record the domain as not detected or unreachable for this pass. Never translate that outcome into proof of absence.',
  },
  {
    name: 'Source false positive',
    cause:
      'Documentation, examples, stale bundles, or bridge markers can resemble an active registration path.',
    treatment:
      'Retain the exact signal and source-only label. Upgrade only after a supported browser exposes the tool.',
  },
  {
    name: 'Directory selection bias',
    cause:
      'Submitted and curated directories overrepresent visible builders, demos, and ecosystems their maintainers actively discover.',
    treatment:
      'Report directory coverage separately from the fixed Tranco prevalence sample and reconcile exact hosts explicitly.',
  },
  {
    name: 'Platform multiplication',
    cause:
      'One platform integration can appear on many customer properties without representing independent implementation decisions.',
    treatment:
      'Separate provider-engineered from platform-inherited deployments and avoid additive totals without de-duplication.',
  },
  {
    name: 'API-generation drift',
    cause:
      'Live sites may expose document.modelContext, an older navigator surface, a bridge, or a mixture during proposal churn.',
    treatment:
      'Publish the observed surface and compatibility state beside every inspected record.',
  },
  {
    name: 'Runtime uncertainty',
    cause:
      'Source code does not prove that the browser exposed a tool, an agent selected it, invocation succeeded, or the page reached the intended state.',
    treatment:
      'Reserve runtime-verified for an observed execution trace with postcondition evidence.',
  },
];

const upgradeRules = [
  [
    'Third-party indexed',
    'A named external index contains the site and tool inventory.',
    'Retain the external source, timestamp, and limitations.',
  ],
  [
    'Source confirmed',
    'isWebMCP recovers a registration path, manifest, tool name, or schema from bounded public source.',
    'Publish the exact source URL, observed surface, and collection boundary.',
  ],
  [
    'Runtime verified',
    'A supported browser exposes and invokes the tool in a controlled trial.',
    'Retain environment, timestamps, inputs, outputs, and a verified postcondition.',
  ],
  [
    'Measured effect',
    'Paired UI-only and tool-assisted runs use the same task, fixture, starting state, and success criteria.',
    'Publish raw outcomes and uncertainty before summarizing any performance lift.',
  ],
];

export default function AdoptionMethodologyPage() {
  const census = latestAdoptionReport.census;
  const comparison = compareDirectoryWithCensus(
    webMcpDirectory,
    census?.detections ?? [],
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'WebMCP adoption research methodology',
    dateModified: webMcpDirectory.generatedAt,
    mainEntityOfPage: `${siteOrigin}/adoption/methodology`,
    author: { '@type': 'Organization', name: 'isWebMCP', url: siteOrigin },
    about: ['WebMCP', 'web agents', 'technology adoption measurement'],
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <section className="border-b border-border bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <div className="flex flex-wrap gap-2">
            <span className="status-chip border-paper/15 text-paper/70">
              <Scale className="size-3 text-signal" aria-hidden="true" />
              Open research contract
            </span>
            <span className="status-chip border-paper/15 text-paper/70">
              Versioned daily
            </span>
          </div>
          <div className="mt-9 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="eyebrow text-signal">Adoption methodology</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.06em] sm:text-6xl">
                Count the claim before counting the market.
              </h1>
            </div>
            <div>
              <p className="text-lg leading-8 text-paper/65">
                isWebMCP measures prevalence, implementation evidence, directory
                coverage, and runtime behavior as separate research questions.
                Every published number keeps its denominator, collection
                boundary, provenance, and uncertainty.
              </p>
              <Link
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-paper underline decoration-paper/30 underline-offset-4"
                href="/adoption"
              >
                Explore the current report{' '}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 lg:px-8">
        <section aria-labelledby="units-heading">
          <div className="grid gap-7 lg:grid-cols-[.5fr_1.5fr]">
            <div>
              <p className="eyebrow">Measurement units</p>
              <h2
                id="units-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Four questions, four denominators
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                A directory entry, a domain-level source detection, an inspected
                implementation, and a successful runtime task are distinct
                observations. They are never added into one adoption score.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {[
                {
                  label: 'Open-web prevalence',
                  owner: 'isWebMCP census',
                  unit: `${census?.scheduledCount.toLocaleString() ?? '—'} ranked domains`,
                  result: `${census?.detectedCount ?? '—'} source signals`,
                  claim:
                    'A qualifying signal was visible in bounded homepage source during this dated pass.',
                },
                {
                  label: 'Implementation evidence',
                  owner: 'isWebMCP ledger',
                  unit: `${latestAdoptionReport.findings.length} named organizations`,
                  result: `${latestAdoptionReport.summary.directlyInspectedOrganizations} directly inspected`,
                  claim:
                    'The linked evidence supports a stated tool, surface, attribution, and limitation.',
                },
                {
                  label: 'Directory coverage',
                  owner: 'webmcp.com API',
                  unit: `${webMcpDirectory.summary.directorySites.toLocaleString()} indexed sites`,
                  result: `${webMcpDirectory.summary.indexedTools.toLocaleString()} classified tools`,
                  claim:
                    'The external index contains the record; isWebMCP has not independently verified every entry.',
                },
                {
                  label: 'Runtime performance',
                  owner: 'Controlled benchmark',
                  unit: 'Tasks × sites × interfaces × attempts',
                  result: 'Success, latency, cost, and trace evidence',
                  claim:
                    'An agent completed or failed a defined task under a published harness.',
                },
              ].map((item) => (
                <article key={item.label} className="bg-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-[.13em] text-signal-ink">
                    {item.owner}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{item.label}</h3>
                  <p className="mt-6 text-3xl font-semibold tracking-[-.05em]">
                    {item.result}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Denominator: {item.unit}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {item.claim}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="instrument-card overflow-hidden"
          aria-labelledby="pipeline-heading"
        >
          <div className="border-b border-border p-6 lg:p-8">
            <p className="eyebrow">Research pipeline</p>
            <h2
              id="pipeline-heading"
              className="mt-2 text-3xl font-semibold tracking-[-.04em]"
            >
              Discovery expands coverage; evidence upgrades confidence.
            </h2>
          </div>
          <div className="grid gap-px bg-border md:grid-cols-4">
            {[
              [
                '01',
                'Discover',
                'Fixed web sample, GitHub candidates, public announcements, and attributed external indexes.',
              ],
              [
                '02',
                'Normalize',
                'Canonical hosts, API surfaces, tool names, implementation type, and observation timestamps.',
              ],
              [
                '03',
                'Reconcile',
                'Exact-host overlap, inherited deployments, de-duplication gaps, and day-over-day changes.',
              ],
              [
                '04',
                'Verify',
                'Source inspection, supported-browser exposure, invocation, and postcondition evidence.',
              ],
            ].map(([number, title, body]) => (
              <article key={number} className="bg-card p-6">
                <span className="font-mono text-xs text-signal-ink">
                  {number}
                </span>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
          <div className="grid gap-5 border-t border-border bg-muted/20 p-6 sm:grid-cols-3 lg:p-8">
            <div>
              <p className="text-3xl font-semibold">
                {comparison.overlapCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                exact-host overlaps between current positive census detections
                and the external directory
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold">
                {comparison.independentOnlyCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                independent detections absent from the external directory under
                the same comparison rule
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold">
                {webMcpDirectoryHistory.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                append-only daily ecosystem snapshots retained so far
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="evidence-heading">
          <div className="grid gap-7 lg:grid-cols-[.55fr_1.45fr]">
            <div>
              <p className="eyebrow">Evidence upgrades</p>
              <h2
                id="evidence-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Stronger labels require stronger observations
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Confidence cannot be upgraded because a record looks plausible
                or appears in multiple indexes. Each level has a concrete
                admission rule and retained evidence requirement.
              </p>
            </div>
            <div className="space-y-3">
              {upgradeRules.map(([level, admission, retained], index) => (
                <article
                  key={level}
                  className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-[170px_1fr_1fr]"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {index > 1 ? (
                      <ShieldCheck
                        className="size-4 text-positive"
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleAlert
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    {level}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">Admission:</strong>{' '}
                    {admission}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">Retained:</strong>{' '}
                    {retained}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="failure-heading">
          <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-5">
            <div>
              <p className="eyebrow">Known failure modes</p>
              <h2
                id="failure-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Every collection method has blind spots
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              The report publishes these risks because a trustworthy market map
              must explain how it can be wrong, not only how many records it
              has.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {failureModes.map((mode) => (
              <article key={mode.name} className="instrument-card p-5">
                <div className="flex items-center gap-2">
                  <CircleAlert
                    className="size-4 text-warning"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">{mode.name}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  <strong className="text-foreground">Cause:</strong>{' '}
                  {mode.cause}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  <strong className="text-foreground">Treatment:</strong>{' '}
                  {mode.treatment}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-xl border border-border bg-card p-6 lg:p-8"
          aria-labelledby="reproduce-heading"
        >
          <div className="grid gap-8 lg:grid-cols-[.62fr_1.38fr]">
            <div>
              <p className="eyebrow">Reproducibility</p>
              <h2
                id="reproduce-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Audit the report from its artifacts
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Dated reports remain stable. Current broad-directory records,
                provenance, change history, reconciliation, and citation policy
                are exposed as JSON. Positive census detections carry their own
                audit digest and source-list identity.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Database,
                  title: 'Adoption dataset',
                  detail: 'Current report plus archive index.',
                  href: '/adoption/data.json',
                },
                {
                  icon: RadioTower,
                  title: 'Ecosystem snapshot',
                  detail: 'Normalized external records, history, and overlap.',
                  href: '/adoption/ecosystem.json',
                },
                {
                  icon: Scale,
                  title: 'Dated report',
                  detail: 'Stable citation target for the current collection.',
                  href: `/adoption/${latestAdoptionReport.date}`,
                },
                {
                  icon: ShieldCheck,
                  title: 'General evidence methodology',
                  detail: 'Scanner, contract, runtime, and lift boundaries.',
                  href: '/methodology',
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl border border-border bg-muted/20 p-5"
                >
                  <item.icon
                    className="size-5 text-signal-ink"
                    aria-hidden="true"
                  />
                  <h3 className="mt-6 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.detail}
                  </p>
                </Link>
              ))}
            </div>
          </div>
          <p className="mt-7 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            Current ecosystem digest: <code>{webMcpDirectory.digest}</code> ·
            external source:{' '}
            <a
              className="font-semibold text-foreground underline underline-offset-4"
              href={webMcpDirectory.source.methodologyUrl}
            >
              webmcp.com methodology
            </a>
            . {comparison.limitation}
          </p>
        </section>
      </div>
    </main>
  );
}
