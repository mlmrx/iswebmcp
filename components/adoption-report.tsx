import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CodeXml,
  Database,
  Download,
  Layers3,
  RadioTower,
} from 'lucide-react';
import Link from 'next/link';

import { AdoptionExplorer } from '@/components/adoption-explorer';
import { AdoptionCensusExplorer } from '@/components/adoption-census';
import {
  adoptionReports,
  formatAdoptionDate,
  type AdoptionReport,
} from '@/lib/adoption';

export function AdoptionReportView({ report }: { report: AdoptionReport }) {
  const headlineMetrics = report.census
    ? [
        [report.census.detectedCount, 'Source signals', 'Top-10,000 pass'],
        [report.census.scheduledCount, 'Domains checked', 'Tranco denominator'],
        [
          report.census.namedToolDefinitions,
          'Named tools',
          'Recovered in source',
        ],
        [
          report.summary.providerEngineeredDeployments,
          'Engineered deployments',
          'Linked external ledger',
        ],
      ]
    : [
        [
          report.summary.providerEngineeredDeployments,
          'Provider-engineered',
          'External census',
        ],
        [
          report.summary.platformInheritedDeployments,
          'Platform-inherited',
          'One ReadMe bundle',
        ],
        [
          report.summary.directlyInspectedOrganizations,
          'Directly inspected',
          'This report',
        ],
        [
          report.summary.namedToolDefinitions,
          'Named tools',
          'Evidence-backed records',
        ],
      ];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <section className="border-b border-border bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="grid gap-9 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="status-chip border-paper/15 text-paper/70">
                  <RadioTower
                    className="size-3 text-signal"
                    aria-hidden="true"
                  />
                  Daily adoption desk
                </span>
                <span className="status-chip border-paper/15 text-paper/70">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {formatAdoptionDate(report.date)}
                </span>
              </div>
              <p className="eyebrow mt-8 text-signal">WebMCP adoption report</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.06em] sm:text-6xl">
                A daily map of WebMCP adoption.
              </h1>
            </div>
            <div>
              <p className="text-lg leading-8 text-paper/65">{report.dek}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {report.census ? (
                  <Link
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-signal px-4 text-sm font-semibold text-ink"
                    href="#census-heading"
                  >
                    Explore the first pass{' '}
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Link>
                ) : null}
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-paper/20 px-4 text-sm font-semibold text-paper"
                  href={`/adoption/${report.date}/report.json`}
                >
                  <Database className="size-4" aria-hidden="true" /> JSON
                </Link>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-paper/20 px-4 text-sm font-semibold text-paper"
                  href="/adoption/latest.md"
                >
                  <Download className="size-4" aria-hidden="true" /> Markdown
                </Link>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-paper/20 px-4 text-sm font-semibold text-paper"
                  href="/adoption/feed.xml"
                >
                  RSS
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {headlineMetrics.map(([value, label, detail]) => (
              <article key={String(label)} className="bg-ink-soft p-5 sm:p-6">
                <p className="text-4xl font-semibold tracking-[-.06em] text-paper">
                  {value}
                </p>
                <p className="mt-6 text-sm font-semibold text-paper">{label}</p>
                <p className="mt-1 text-xs text-paper/45">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-10 lg:px-8">
        <section aria-labelledby="readout-heading">
          <div className="grid gap-6 lg:grid-cols-[.5fr_1.5fr]">
            <div>
              <p className="eyebrow">Today&apos;s readout</p>
              <h2
                id="readout-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                The number needs a denominator
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {report.changeSummary}
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {report.analysis.map((item, index) => (
                <article key={item.heading} className="bg-card p-6">
                  <span className="font-mono text-xs text-signal-ink">
                    0{index + 1}
                  </span>
                  <h3 className="mt-8 text-xl font-semibold tracking-[-.025em]">
                    {item.heading}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="instrument-card overflow-hidden"
          aria-labelledby="count-model-heading"
        >
          <div className="grid gap-7 p-6 lg:grid-cols-[.7fr_1.3fr] lg:p-8">
            <div>
              <p className="eyebrow">Counting model</p>
              <h2
                id="count-model-heading"
                className="mt-2 text-2xl font-semibold tracking-[-.035em]"
              >
                81 sightings ≠ 81 adoption decisions
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The linked external census started with 730 MCP providers. Its
                81 WebMCP detections split into two very different groups.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="rounded-xl border border-border bg-muted/45 p-5">
                <Layers3 className="size-5 text-warning" aria-hidden="true" />
                <p className="mt-6 text-3xl font-semibold">72</p>
                <p className="mt-1 text-sm font-semibold">
                  Inherited from ReadMe
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  One platform bundle, repeated across hosted docs.
                </p>
              </div>
              <ArrowRight
                className="self-center justify-self-center rotate-90 text-muted-foreground sm:rotate-0"
                aria-hidden="true"
              />
              <div className="rounded-xl border border-signal-ink/25 bg-signal/10 p-5">
                <CodeXml
                  className="size-5 text-signal-ink"
                  aria-hidden="true"
                />
                <p className="mt-6 text-3xl font-semibold">9</p>
                <p className="mt-1 text-sm font-semibold">
                  Provider-engineered
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  The more meaningful early-adoption indicator.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-muted/25 px-6 py-4 text-xs leading-5 text-muted-foreground lg:px-8">
            Counts are reproduced from the linked APIs.io census and are not an
            independently replicated isWebMCP crawl. Daily reports retain that
            provenance until a first-party census is complete.
          </div>
        </section>

        {report.census ? (
          <AdoptionCensusExplorer census={report.census} />
        ) : null}

        <AdoptionExplorer findings={report.findings} />

        <section
          className="grid gap-6 lg:grid-cols-[.62fr_1.38fr]"
          aria-labelledby="methodology-heading"
        >
          <div>
            <p className="eyebrow">Evidence policy</p>
            <h2
              id="methodology-heading"
              className="mt-2 text-3xl font-semibold tracking-[-.04em]"
            >
              Claims stop where observation stops
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              {report.methodology.scope}
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
              href="/methodology"
            >
              Read the wider evidence methodology{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-3">
            {report.methodology.evidenceLevels.map((item) => (
              <div
                key={item.level}
                className="grid gap-2 rounded-xl border border-border bg-card p-5 sm:grid-cols-[180px_1fr]"
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {item.level === 'runtime-verified' ? (
                    <CheckCircle2
                      className="size-4 text-positive"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleAlert
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  {item.level.replaceAll('-', ' ')}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="archive-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="eyebrow">Append-only archive</p>
              <h2 id="archive-heading" className="mt-2 text-2xl font-semibold">
                Daily reports
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {adoptionReports.length} published snapshot
              {adoptionReports.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="divide-y divide-border">
            {adoptionReports.map((item) => (
              <Link
                key={item.date}
                href={`/adoption/${item.date}`}
                className="grid gap-2 py-5 sm:grid-cols-[180px_1fr_auto] sm:items-center"
              >
                <time className="font-mono text-xs" dateTime={item.date}>
                  {formatAdoptionDate(item.date)}
                </time>
                <span className="text-sm text-muted-foreground">
                  {item.changeSummary}
                </span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
