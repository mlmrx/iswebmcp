'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  displayBand,
  type OpportunityBand,
  type WebIndexSnapshot,
} from '@/lib/web-index';

const bandColor: Record<OpportunityBand, string> = {
  high_leverage: 'bg-signal text-ink',
  strong_candidate: 'bg-emerald-500/18 text-emerald-800',
  foundation: 'bg-amber-500/18 text-amber-800',
  low_interaction: 'bg-muted text-muted-foreground',
};

function OpportunityLandscape({ snapshot }: { snapshot: WebIndexSnapshot }) {
  const points = snapshot.rows.filter(
    (row) =>
      row.state === 'scored' &&
      row.baselineScore != null &&
      row.opportunityScore != null,
  );
  return (
    <div>
      <div className="relative h-[22rem] overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute inset-x-12 top-1/2 border-t border-dashed border-border" />
        <div className="absolute inset-y-10 left-1/2 border-l border-dashed border-border" />
        <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Higher opportunity
        </span>
        <span className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Stronger baseline →
        </span>
        <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Weaker baseline
        </span>
        {points.map((row) => (
          <a
            key={row.popularityRank}
            href={`#rank-${row.popularityRank}`}
            className="group absolute grid size-4 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full border-2 border-card bg-signal-ink shadow-sm transition-transform hover:z-20 hover:scale-150 focus:z-20 focus:scale-150"
            style={{
              left: `${8 + (row.baselineScore! / 100) * 84}%`,
              bottom: `${10 + (row.opportunityScore! / 100) * 78}%`,
              width: `${Math.max(11, 22 - Math.log10(row.popularityRank + 1) * 3)}px`,
              height: `${Math.max(11, 22 - Math.log10(row.popularityRank + 1) * 3)}px`,
            }}
            aria-label={`${row.domain}: baseline ${row.baselineScore}, opportunity ${row.opportunityScore}`}
          >
            <span className="pointer-events-none absolute bottom-5 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 font-mono text-[10px] text-white group-hover:block group-focus:block">
              {row.domain} · {row.baselineScore}/{row.opportunityScore}
            </span>
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Each dot is one scored homepage. Dot size reflects popularity tier;
        position reflects our source-only heuristic. This is an opportunity map,
        not a product-quality grade.
      </p>
    </div>
  );
}

function BeforeAfter() {
  const before = [
    [
      '1',
      'Interpret pixels and prose',
      'The agent reconstructs intent from an interface built for people.',
    ],
    [
      '2',
      'Recover fragile selectors',
      'Labels, DOM structure, and client state can shift between runs.',
    ],
    [
      '3',
      'Guess whether it worked',
      'Success must be inferred from visual or textual side effects.',
    ],
  ];
  const after = [
    [
      '1',
      'Discover explicit tools',
      'Named capabilities describe when and why they should be used.',
    ],
    [
      '2',
      'Invoke a typed contract',
      'Inputs are constrained before a consequential action executes.',
    ],
    [
      '3',
      'Verify a declared result',
      'Structured output supports deterministic post-action checks.',
    ],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="eyebrow">Observed web interaction</p>
        <h3 className="mt-2 text-xl font-semibold">Before: inference-heavy</h3>
        <div className="mt-5 space-y-3">
          {before.map(([number, title, body]) => (
            <div
              key={number}
              className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl bg-muted/55 p-3"
            >
              <span className="grid size-8 place-items-center rounded-full border border-border font-mono text-xs">
                {number}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden items-center lg:flex">
        <ArrowRight className="size-6 text-signal-ink" />
      </div>
      <div className="rounded-2xl border border-signal-ink/30 bg-signal/8 p-5">
        <p className="eyebrow text-signal-ink">Illustrative design target</p>
        <h3 className="mt-2 text-xl font-semibold">After: contract-driven</h3>
        <div className="mt-5 space-y-3">
          {after.map(([number, title, body]) => (
            <div
              key={number}
              className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl border border-signal-ink/15 bg-card p-3"
            >
              <span className="grid size-8 place-items-center rounded-full bg-signal font-mono text-xs font-semibold text-ink">
                {number}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IndexExplorer({ snapshot }: { snapshot: WebIndexSnapshot }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | OpportunityBand | 'coverage'>(
    'all',
  );
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.rows.filter((row) => {
      if (
        normalized &&
        !row.domain.includes(normalized) &&
        String(row.popularityRank) !== normalized
      )
        return false;
      if (filter === 'coverage') return row.state !== 'scored';
      if (filter !== 'all') return row.opportunityBand === filter;
      return true;
    });
  }, [filter, query, snapshot.rows]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="eyebrow text-signal-ink">The opportunity landscape</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Where structured web actions could remove the most guesswork
            </h2>
          </div>
          <p className="self-end text-sm leading-6 text-muted-foreground">
            Opportunity combines source-observed workflow density, baseline
            friction, and the absence of a WebMCP source hint. It does not claim
            a site is broken, unsafe, or low quality.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <OpportunityLandscape snapshot={snapshot} />
          <div className="instrument-card p-5">
            <p className="eyebrow">Opportunity bands</p>
            <div className="mt-5 space-y-5">
              {snapshot.distribution.map(({ band, count }) => {
                const share = snapshot.scoredCount
                  ? (count / snapshot.scoredCount) * 100
                  : 0;
                return (
                  <div key={band}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{displayBand(band)}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={bandColor[band].split(' ')[0]}
                        style={{ width: `${share}%`, height: '100%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-signal-ink">
                Visualizing the value proposition
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                From interface archaeology to explicit contracts
              </h2>
            </div>
            <span className="status-chip">
              Illustration · not measured lift
            </span>
          </div>
          <BeforeAfter />
        </div>
      </section>

      <section id="rankings" className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Public results</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Observed homepage ranking
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Sorted by WebMCP opportunity. “Popular” is Tranco rank; “baseline”
              and “opportunity” are isWebMCP scores. Unscored rows stay visible
              as coverage evidence.
            </p>
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
              placeholder="Search domain or popularity rank"
              aria-label="Search index"
            />
          </div>
        </div>
        <fieldset
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Filter index"
        >
          {(
            [
              'all',
              'high_leverage',
              'strong_candidate',
              'foundation',
              'coverage',
            ] as const
          ).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${filter === value ? 'border-ink bg-ink text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
            >
              {value === 'all'
                ? 'All results'
                : value === 'coverage'
                  ? 'Coverage gaps'
                  : displayBand(value)}
            </button>
          ))}
        </fieldset>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Popular</th>
                  <th className="px-4 py-3">Baseline</th>
                  <th className="px-4 py-3">Actions</th>
                  <th className="px-4 py-3">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.slice(0, 100).map((row) => (
                  <tr
                    id={`rank-${row.popularityRank}`}
                    key={row.popularityRank}
                    className="scroll-mt-24 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 font-mono text-xs text-muted-foreground">
                          {row.opportunityRank ?? '—'}
                        </span>
                        {row.opportunityScore != null ? (
                          <>
                            <span className="font-mono text-base font-semibold">
                              {row.opportunityScore}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${bandColor[row.opportunityBand!]}`}
                            >
                              {displayBand(row.opportunityBand!)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Not scored
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.domain}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      #{row.popularityRank}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.baselineScore ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.actionCandidates ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-muted-foreground">
                        {row.state.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No rows match that filter.
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {Math.min(rows.length, 100)} of {rows.length} matching rows in
          this browser snapshot. The downloadable dataset contains all{' '}
          {snapshot.attemptedCount.toLocaleString()} attempts.
        </p>
      </section>
    </>
  );
}
