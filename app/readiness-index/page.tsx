import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowDown,
  Database,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

import { IndexExplorer } from '@/components/index-explorer';
import snapshotData from '@/data/webmcp-index/snapshot.json';
import type { WebIndexSnapshot } from '@/lib/web-index';

const snapshot = snapshotData as WebIndexSnapshot;

export const metadata: Metadata = {
  title: 'WebMCP Readiness Index',
  description:
    'An audited exploratory dataset of source-observed WebMCP opportunity signals, collection gaps, and crawler health across a scheduled 100,000-domain corpus.',
  alternates: { canonical: '/readiness-index' },
  openGraph: {
    title: 'The WebMCP Readiness Index · isWebMCP',
    description: `${snapshot.scheduledCount.toLocaleString()} domains scheduled; ${snapshot.validAttemptCount.toLocaleString()} valid collection outcomes and ${snapshot.collectionErrorCount.toLocaleString()} quarantined crawler errors.`,
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'WebMCP Readiness Index',
      },
    ],
  },
};

export default function WebMcpIndexPage() {
  const completion = (snapshot.attemptedCount / snapshot.targetCount) * 100;
  const statusLabel =
    snapshot.status === 'audited_partial'
      ? 'Audited partial dataset'
      : `${snapshot.status.replaceAll('_', ' ')} dataset`;
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: snapshot.title,
    description: `Exploratory WRI v1 source observations for a pinned Tranco list. ${snapshot.validAttemptCount} records have valid collection outcomes; ${snapshot.collectionErrorCount} scanner-infrastructure errors are quarantined.`,
    dateModified: snapshot.generatedAt,
    measurementTechnique: snapshot.version,
    isBasedOn: snapshot.source.listUrl,
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json+gzip',
      contentUrl: '/data/webmcp-index.json.gz',
    },
  };
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetJsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="flex flex-wrap gap-2">
            <span className="status-chip">
              <Database className="size-3" /> Public benchmark
            </span>
            <span className="status-chip">
              <ShieldCheck className="size-3" /> Robots-aware · source only
            </span>
            <span className="status-chip">{statusLabel}</span>
          </div>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="eyebrow text-signal-ink">
                WebMCP Readiness Index · {snapshot.version}
              </p>
              <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">
                The web’s action layer, mapped.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                A frozen exploratory scan with its collection failures exposed.
                Use it to inspect hypotheses—not as a definitive league table of
                websites or WebMCP implementations.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#rankings"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white"
                >
                  Explore rankings <ArrowDown className="size-4" />
                </a>
                <Link
                  href="/readiness-index-methodology"
                  className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
                >
                  Read index methodology
                </Link>
              </div>
            </div>
            <div className="instrument-card overflow-hidden">
              <div className="border-b border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Scheduled corpus</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {snapshot.attemptedCount.toLocaleString()}{' '}
                      <span className="text-base font-normal text-muted-foreground">
                        / {snapshot.targetCount.toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-signal/25 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-signal-ink">
                    Audited partial
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full min-w-1 rounded-full bg-signal-ink"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  The runner emitted one record for every scheduled rank, but
                  only {snapshot.validAttemptCount.toLocaleString()} are valid
                  collection outcomes. We quarantined{' '}
                  {snapshot.collectionErrorCount.toLocaleString()} records from
                  two scanner-wide failure windows instead of attributing them
                  to websites.
                </p>
              </div>
              <div className="grid grid-cols-2 border-b border-border sm:grid-cols-3">
                <div className="p-5">
                  <p className="eyebrow">Valid outcomes</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {snapshot.validAttemptCount.toLocaleString()}
                  </p>
                </div>
                <div className="border-l border-border p-5">
                  <p className="eyebrow">Scored</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {snapshot.scoredCount.toLocaleString()}
                  </p>
                </div>
                <div className="border-l border-border p-5">
                  <p className="eyebrow">Quarantined</p>
                  <p className="mt-2 text-2xl font-semibold text-warning">
                    {snapshot.collectionErrorCount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="eyebrow">Pinned source</p>
                <a
                  className="mt-2 inline-flex items-center gap-1 text-lg font-semibold underline decoration-border underline-offset-4"
                  href={snapshot.source.listUrl}
                >
                  {snapshot.source.listId}
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Coverage is part of the result
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Attempted{' '}
                  {new Date(snapshot.generatedAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'UTC',
                  })}{' '}
                  UTC
                </p>
              </div>
              <a
                href="/data/webmcp-index.json.gz"
                download
                className="inline-flex items-center gap-2 text-xs font-medium underline decoration-border underline-offset-4"
              >
                <Download className="size-3" /> Download snapshot
              </a>
            </div>
            <CoverageBarForPage snapshot={snapshot} />
          </div>
        </div>
      </section>
      <IndexExplorer snapshot={snapshot} />
    </main>
  );
}

function CoverageBarForPage({ snapshot }: { snapshot: WebIndexSnapshot }) {
  const sections = [
    ['scored', 'bg-signal'],
    ['robots_blocked', 'bg-amber-400'],
    ['unreachable', 'bg-slate-400'],
    ['unsupported', 'bg-violet-400'],
    ['unsafe', 'bg-red-400'],
    ['collection_error', 'bg-rose-700'],
  ] as const;
  return (
    <>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {sections.map(([key, color]) => (
          <span
            key={key}
            className={color}
            style={{
              width: `${(snapshot.coverage[key] / snapshot.attemptedCount) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span>Scored · {snapshot.coverage.scored}</span>
        <span>Robots excluded · {snapshot.coverage.robots_blocked}</span>
        <span>Unreachable · {snapshot.coverage.unreachable}</span>
        <span>Unsupported · {snapshot.coverage.unsupported}</span>
        <span>Unsafe target · {snapshot.coverage.unsafe}</span>
        <span>
          Scanner collection error · {snapshot.coverage.collection_error}
        </span>
      </div>
    </>
  );
}
