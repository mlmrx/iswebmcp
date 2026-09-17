'use client';

import {
  ArrowUpRight,
  Database,
  Filter,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type {
  DirectoryCensusComparison,
  DirectoryHistoryEntry,
  DirectorySiteType,
  DirectoryToolKind,
  WebMcpDirectorySnapshot,
} from '@/lib/adoption-directory';

const kindLabels: Record<DirectoryToolKind, string> = {
  answer: 'Answer',
  act: 'Action',
  transact: 'Sensitive action',
};

function observedDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function AdoptionEcosystemAtlas({
  snapshot: initialSnapshot,
  history,
  comparison,
}: {
  snapshot: WebMcpDirectorySnapshot;
  history: DirectoryHistoryEntry[];
  comparison: DirectoryCensusComparison;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(initialSnapshot.sites.length === 0);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | DirectorySiteType>('all');
  const [category, setCategory] = useState('all');
  const [kind, setKind] = useState<'all' | DirectoryToolKind>('all');
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    if (initialSnapshot.sites.length) return;
    const controller = new AbortController();
    let active = true;
    fetch('/adoption/ecosystem.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<WebMcpDirectorySnapshot>;
      })
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Could not load the ecosystem snapshot.', error);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [initialSnapshot.sites.length]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.sites
      .filter((site) => {
        if (type !== 'all' && site.type !== type) return false;
        if (category !== 'all' && site.category !== category) return false;
        if (kind !== 'all' && !site.tools.some((tool) => tool.kind === kind))
          return false;
        if (!normalized) return true;
        return [
          site.host,
          site.category,
          site.summary,
          site.apiSurface,
          ...site.tools.map((tool) => tool.name),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      })
      .sort(
        (left, right) =>
          right.toolCount - left.toolCount ||
          left.host.localeCompare(right.host),
      );
  }, [category, kind, query, snapshot.sites, type]);

  const summary = snapshot.summary;
  const layers = [
    {
      label: 'Independent prevalence monitor',
      owner: 'isWebMCP',
      unit: '10,000 ranked domains',
      proves: 'A source signal was visible during our robots-aware crawl.',
      limit: 'Homepage source does not prove runtime availability.',
      href: '#census-heading',
    },
    {
      label: 'Inspected evidence ledger',
      owner: 'isWebMCP',
      unit: 'Named implementations',
      proves:
        'Sources, tools, API surface, attribution, and limits were reviewed.',
      limit: 'Small by design; it does not claim global coverage.',
      href: '#inventory-heading',
    },
    {
      label: 'Ecosystem directory',
      owner: 'webmcp.com',
      unit: `${summary.directorySites.toLocaleString()} indexed sites`,
      proves: 'The external directory indexed a site and its declared tools.',
      limit: 'Reproduced index coverage; not independently runtime verified.',
      href: snapshot.source.methodologyUrl,
    },
    {
      label: 'Runtime task benchmark',
      owner: 'WindTunnel',
      unit: 'Sites × tasks × interfaces',
      proves: 'Agent outcomes, latency, and cost under a published harness.',
      limit: 'Performance evidence does not measure market adoption.',
      href: 'https://webmcp.com/benchmark',
    },
  ];

  return (
    <section
      id="ecosystem-atlas"
      className="scroll-mt-24 space-y-8"
      aria-labelledby="ecosystem-atlas-heading"
    >
      <div className="grid gap-6 lg:grid-cols-[.62fr_1.38fr]">
        <div>
          <p className="eyebrow">Ecosystem atlas</p>
          <h2
            id="ecosystem-atlas-heading"
            className="mt-2 text-3xl font-semibold tracking-[-.04em]"
          >
            One market, four different questions
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The apparent count disagreement comes from different units. This
            atlas keeps prevalence, inspected evidence, directory coverage, and
            runtime performance separate, then makes all four usable together.
          </p>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            External snapshot observed {observedDate(snapshot.generatedAt)} UTC
            · digest <code>{snapshot.digest.slice(0, 12)}…</code>
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-border">
          {layers.map((layer) => (
            <a
              key={layer.label}
              className="grid gap-2 border-b border-border bg-card p-5 last:border-b-0 sm:grid-cols-[1fr_1fr]"
              href={layer.href}
            >
              <span>
                <span className="block text-sm font-semibold">
                  {layer.label}
                </span>
                <span className="mt-1 block text-xs text-signal-ink">
                  {layer.owner} · {layer.unit}
                </span>
              </span>
              <span className="text-xs leading-5 text-muted-foreground">
                <strong className="text-foreground">Evidence:</strong>{' '}
                {layer.proves}{' '}
                <strong className="text-foreground">Boundary:</strong>{' '}
                {layer.limit}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="instrument-card overflow-hidden">
        <div className="border-b border-border bg-ink p-6 text-paper lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="status-chip border-paper/15 text-paper/70">
                  <Database className="size-3 text-signal" aria-hidden="true" />
                  Third-party indexed
                </span>
                <span className="status-chip border-paper/15 text-paper/70">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Provenance retained
                </span>
              </div>
              <h3 className="mt-5 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
                Search {summary.directorySites.toLocaleString()} sites and{' '}
                {summary.indexedTools.toLocaleString()} tools.
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-paper/60">
                This daily snapshot normalizes webmcp.com&apos;s public API for
                comparative research. Every record remains labeled as external
                index evidence until our own inspection upgrades it.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 text-sm font-semibold text-paper underline decoration-paper/30 underline-offset-4"
              href={snapshot.source.apiDocsUrl}
            >
              Source API docs{' '}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [summary.liveSites, 'Live sites'],
              [summary.demoSites, 'Demo sites'],
              [summary.transactionTools, 'Sensitive-action tools'],
              [summary.shopifyStores, 'Shopify platform estimate'],
            ].map(([value, label]) => (
              <div key={String(label)} className="bg-ink-soft p-4">
                <p className="text-2xl font-semibold tracking-[-.05em]">
                  {Number(value).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-paper/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-border bg-warning/10 px-6 py-4 text-xs leading-5 text-muted-foreground lg:px-8">
          The source reports {summary.reportedTotalSites.toLocaleString()} total
          sites. Directory sites plus the Shopify estimate differ from that
          total by {summary.additiveReconciliationGap.toLocaleString()}; these
          units may overlap, so this report does not add them into a new
          adoption total.
        </div>

        <div className="grid border-b border-border lg:grid-cols-[1.15fr_.85fr]">
          <div className="border-b border-border p-6 lg:border-b-0 lg:border-r lg:p-8">
            <p className="eyebrow">Cross-source reconciliation</p>
            <h4 className="mt-2 text-2xl font-semibold tracking-[-.035em]">
              Only {comparison.overlapCount} of{' '}
              {comparison.independentDetectionCount} independently detected
              hosts appear in the external directory.
            </h4>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The other {comparison.independentOnlyCount} detections are why the
              two products cannot share a headline total. Our crawl discovers
              source signals in a fixed ranked sample; the directory follows a
              curated and submitted index.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">
                  Exact-host overlap
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {comparison.overlapCount}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {comparison.overlapDomains.join(', ')}
                </p>
              </div>
              <div className="rounded-xl border border-signal-ink/25 bg-signal/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-signal-ink">
                  Independent-only
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {comparison.independentOnlyCount}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {comparison.independentOnlyDomains.join(', ')}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {comparison.limitation}
            </p>
          </div>

          <div className="p-6 lg:p-8">
            <p className="eyebrow">Daily trajectory</p>
            <h4 className="mt-2 text-xl font-semibold tracking-[-.03em]">
              Append-only market snapshots
            </h4>
            <div className="mt-5 space-y-3">
              {history.slice(0, 7).map((entry) => (
                <div
                  key={entry.date}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <time className="font-mono text-xs" dateTime={entry.date}>
                      {entry.date}
                    </time>
                    <span className="text-xs text-muted-foreground">
                      {entry.summary.directorySites.toLocaleString()} sites ·{' '}
                      {entry.summary.indexedTools.toLocaleString()} tools
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {entry.change.previousDate
                      ? `${entry.change.addedSites} added, ${entry.change.removedSites} removed, ${entry.change.indexedToolDelta >= 0 ? '+' : ''}${entry.change.indexedToolDelta} tools since ${entry.change.previousDate}.`
                      : 'Baseline snapshot; daily additions and removals begin with the next collection.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 lg:p-8">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search indexed sites and tools</span>
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(24);
                }}
                placeholder="Search site, category, or tool"
                type="search"
                value={query}
              />
            </label>
            <label>
              <span className="sr-only">Filter site type</span>
              <select
                className="h-11 min-w-32 rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) => {
                  setType(event.target.value as typeof type);
                  setVisibleCount(24);
                }}
                value={type}
              >
                <option value="all">Live + demo</option>
                <option value="live">Live only</option>
                <option value="demo">Demo only</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter category</span>
              <select
                className="h-11 max-w-52 rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) => {
                  setCategory(event.target.value);
                  setVisibleCount(24);
                }}
                value={category}
              >
                <option value="all">All categories</option>
                {snapshot.aggregates.categories.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label} ({item.count})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter capability</span>
              <select
                className="h-11 min-w-44 rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) => {
                  setKind(event.target.value as typeof kind);
                  setVisibleCount(24);
                }}
                value={kind}
              >
                <option value="all">All capabilities</option>
                <option value="answer">Answer</option>
                <option value="act">Action</option>
                <option value="transact">Sensitive action</option>
              </select>
            </label>
          </div>

          <p
            className="my-5 flex items-center gap-2 font-mono text-xs text-muted-foreground"
            aria-live="polite"
          >
            <Filter className="size-3.5" aria-hidden="true" />
            {loading
              ? 'Loading indexed site records…'
              : `${filtered.length.toLocaleString()} of ${snapshot.sites.length.toLocaleString()} indexed sites match`}
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, visibleCount).map((site) => (
              <article
                key={site.host}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="source-badge">{site.type}</span>
                      <span className="source-badge">{site.apiSurface}</span>
                    </div>
                    <h4 className="mt-4 truncate text-lg font-semibold">
                      {site.host}
                    </h4>
                    <p className="mt-1 text-xs text-signal-ink">
                      {site.category}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-2xl font-semibold">
                      {site.toolCount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      tools
                    </span>
                  </span>
                </div>
                {site.summary ? (
                  <p className="mt-4 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {site.summary}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {site.tools.slice(0, 5).map((tool) => (
                    <span
                      key={`${site.host}-${tool.name}`}
                      className="rounded-md bg-muted px-2 py-1 font-mono text-[10px]"
                      title={`${kindLabels[tool.kind]} · ${tool.implementation}`}
                    >
                      {tool.name}
                    </span>
                  ))}
                  {site.tools.length > 5 ? (
                    <span className="px-1 py-1 text-[10px] text-muted-foreground">
                      +{site.tools.length - 5} more
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Wrench className="size-3" aria-hidden="true" />
                    External index record
                  </span>
                  <a
                    className="inline-flex items-center gap-1 text-xs font-semibold underline decoration-border underline-offset-4"
                    href={site.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Visit <ArrowUpRight className="size-3" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {!loading && !filtered.length ? (
            <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No indexed sites match these filters.
            </div>
          ) : null}
          {visibleCount < filtered.length ? (
            <button
              className="mt-6 h-11 w-full rounded-lg border border-border bg-card text-sm font-semibold"
              onClick={() => setVisibleCount((count) => count + 24)}
              type="button"
            >
              Show 24 more
            </button>
          ) : null}
        </div>

        <div className="border-t border-border bg-muted/25 px-6 py-4 text-xs leading-5 text-muted-foreground lg:px-8">
          {snapshot.caveats.join(' ')}{' '}
          <Link
            className="font-semibold text-foreground underline underline-offset-4"
            href="/adoption/ecosystem.json"
          >
            Download the normalized snapshot.
          </Link>
        </div>
      </div>
    </section>
  );
}
