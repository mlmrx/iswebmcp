'use client';

import { ArrowUpRight, Check, ExternalLink, RadioTower } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { AdoptionReport } from '@/lib/adoption';

type Census = NonNullable<AdoptionReport['census']>;

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return value < 0.01 ? '<0.01%' : `${value.toFixed(2)}%`;
}

function surfaceLabel(surface: Census['detections'][number]['surface']) {
  return surface === 'mixed' ? 'Mixed surface' : `${surface} surface`;
}

function formatCheckedAt(value: string): string {
  return `${value.slice(0, 16).replace('T', ' ')} UTC`;
}

export function AdoptionCensusExplorer({ census }: { census: Census }) {
  const [selectedRank, setSelectedRank] = useState(
    census.detections[0]?.popularityRank ?? 0,
  );
  const selected = useMemo(
    () =>
      census.detections.find(
        (detection) => detection.popularityRank === selectedRank,
      ) ?? census.detections[0],
    [census.detections, selectedRank],
  );
  const limitedCount =
    census.robotsBlockedCount +
    census.unreachableCount +
    census.unsupportedCount;
  const observedPercent = formatPercent(
    (census.detectedCount / census.scheduledCount) * 100,
  );
  const segments = [
    {
      label: 'Signal found',
      count: census.detectedCount,
      color: 'bg-signal',
      text: 'text-signal-ink',
      width: Math.max(
        0.4,
        (census.detectedCount / census.scheduledCount) * 100,
      ),
    },
    {
      label: 'No signal in source',
      count: census.notDetectedCount,
      color: 'bg-foreground/15',
      text: 'text-muted-foreground',
      width: (census.notDetectedCount / census.scheduledCount) * 100,
    },
    {
      label: 'Could not inspect',
      count: limitedCount,
      color: 'bg-warning/70',
      text: 'text-warning',
      width: (limitedCount / census.scheduledCount) * 100,
    },
  ];

  if (!selected) return null;

  return (
    <section
      id="census-heading"
      className="signal-map-card scroll-mt-24 overflow-hidden"
      aria-labelledby="census-title"
      aria-describedby="coverage-description"
    >
      <div className="border-b border-border px-6 py-7 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow text-signal-ink">First-pass signal map</p>
              <span className="coverage-pill coverage-unknown">
                {census.source.name} {census.source.listId}
              </span>
            </div>
            <h2
              id="census-title"
              className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl"
            >
              {census.detectedCount} lit windows in a city of{' '}
              {census.scheduledCount.toLocaleString()} domains.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              This is the fastest honest read of the market: a source-level
              signal was visible on a homepage. It is not a claim that a tool
              was exposed or successfully invoked in a browser.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-signal-ink/25 bg-signal/10 px-5 py-4 text-right">
            <p className="font-mono text-xs font-semibold uppercase tracking-[.14em] text-signal-ink">
              Observed share
            </p>
            <p className="mt-1 text-4xl font-semibold tracking-[-.07em] text-foreground">
              {observedPercent}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {census.detectedCount} / {census.scheduledCount.toLocaleString()}{' '}
              domains
            </p>
          </div>
        </div>

        <div
          className="mt-8 overflow-hidden rounded-full bg-muted"
          aria-hidden="true"
        >
          <div className="flex h-3 w-full">
            {segments.map((segment) => (
              <span
                key={segment.label}
                className={`${segment.color} block min-w-1`}
                style={{ width: `${segment.width}%` }}
              />
            ))}
          </div>
        </div>
        <p id="coverage-description" className="sr-only">
          {census.detectedCount} source signals, {census.notDetectedCount} with
          no signal, and {limitedCount} domains that could not be inspected.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-baseline gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${segment.color}`}
              />
              <span className="text-xl font-semibold tracking-[-.04em]">
                {segment.count.toLocaleString()}
              </span>
              <span className={`text-xs font-medium ${segment.text}`}>
                {segment.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[.9fr_1.1fr]">
        <div className="border-b border-border p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Signal index</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-.03em]">
                Who lit up the pass?
              </h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {census.detections.length} records
            </span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {census.detections.map((detection) => {
              const active = detection.popularityRank === selectedRank;
              return (
                <button
                  key={`${detection.domain}-${detection.popularityRank}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedRank(detection.popularityRank)}
                  className={`signal-index-row text-left ${active ? 'signal-index-row-active' : ''}`}
                >
                  <span className="signal-index-rank">
                    #{detection.popularityRank.toLocaleString()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {detection.domain}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {surfaceLabel(detection.surface)}
                    </span>
                  </span>
                  {active ? (
                    <Check
                      className="size-4 shrink-0 text-signal-ink"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <article className="bg-muted/20 p-6 lg:p-8" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="coverage-pill coverage-yes">
              Source signal found
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              Tranco rank #{selected.popularityRank.toLocaleString()}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-semibold tracking-[-.05em]">
                {selected.domain}
              </h3>
              <p className="mt-1 text-sm font-medium text-signal-ink">
                {surfaceLabel(selected.surface)}
              </p>
            </div>
            <a
              className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-border underline-offset-4"
              href={selected.finalUrl ?? selected.url}
              target="_blank"
              rel="noreferrer"
            >
              Open source page{' '}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <RadioTower
                  className="size-4 text-signal-ink"
                  aria-hidden="true"
                />
                What was visible
              </p>
              <ul className="mt-3 space-y-2">
                {selected.signals.map((signal) => (
                  <li
                    key={signal}
                    className="text-sm leading-6 text-muted-foreground"
                  >
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Named tools recovered</p>
              {selected.tools.length ? (
                <ul className="mt-3 space-y-2">
                  {selected.tools.map((tool) => (
                    <li key={tool}>
                      <code className="text-xs font-semibold text-foreground">
                        {tool}
                      </code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The source exposed a WebMCP marker, but not a recoverable tool
                  name in the homepage HTML.
                </p>
              )}
            </div>
          </div>
          <p className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            Checked {formatCheckedAt(selected.checkedAt)}. The retained ledger
            is positive-only; every other scheduled domain remains represented
            in the coverage counts.
          </p>
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4 text-xs leading-5 text-muted-foreground lg:px-8">
        <span>
          Tranco list{' '}
          <a
            className="font-semibold underline underline-offset-4"
            href={census.source.listUrl}
          >
            {census.source.listId}
          </a>{' '}
          ({census.source.listDate}) · audit digest{' '}
          <code>{census.auditDigest.slice(0, 12)}…</code>
        </span>
        <a
          className="inline-flex items-center gap-1.5 font-semibold text-foreground underline underline-offset-4"
          href={census.dataUrl}
        >
          Download full ledger{' '}
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
