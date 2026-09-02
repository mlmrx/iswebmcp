'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Database, LoaderCircle, Search } from 'lucide-react';

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
  const bins = Array.from({ length: 100 }, () => 0);
  for (const row of points) {
    const x = Math.min(9, Math.floor((row.baselineScore ?? 0) / 10));
    const y = Math.min(9, Math.floor((row.opportunityScore ?? 0) / 10));
    bins[(9 - y) * 10 + x] += 1;
  }
  const maximum = Math.max(...bins, 1);
  return (
    <div>
      <div className="relative h-[22rem] overflow-hidden rounded-xl border border-border bg-card p-10 pb-12 pt-11">
        <span className="absolute left-3 top-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Higher opportunity
        </span>
        <span className="absolute bottom-3 right-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Stronger baseline →
        </span>
        <span className="absolute bottom-3 left-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Weaker baseline
        </span>
        <figure className="grid h-full grid-cols-10 grid-rows-10 gap-1">
          <figcaption className="sr-only">
            Density grid for {points.length} scored rows loaded in this browser
          </figcaption>
          {bins.map((count, index) => {
            const column = index % 10;
            const row = Math.floor(index / 10);
            const baselineRange = `${column * 10}–${column === 9 ? 100 : column * 10 + 9}`;
            const opportunityFloor = (9 - row) * 10;
            const opportunityRange = `${opportunityFloor}–${opportunityFloor === 90 ? 100 : opportunityFloor + 9}`;
            return (
              <div
                key={`${row}-${column}`}
                aria-hidden="true"
                className="rounded-sm border border-signal-ink/10 transition-transform hover:scale-110"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-signal-ink) ${count ? 12 + Math.round((count / maximum) * 88) : 3}%, transparent)`,
                }}
                title={`${count} loaded rows · baseline ${baselineRange} · WRI v1 opportunity ${opportunityRange}`}
              />
            );
          })}
        </figure>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Cells show density for {points.length.toLocaleString()} scored records
        currently loaded in this browser. Position reflects the frozen,
        uncalibrated WRI v1 heuristic—not product quality or measured WebMCP
        readiness.
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
  const [activeSnapshot, setActiveSnapshot] =
    useState<WebIndexSnapshot>(snapshot);
  const [datasetState, setDatasetState] = useState<
    'preview' | 'loading' | 'full' | 'error'
  >(snapshot.rows.length === snapshot.attemptedCount ? 'full' : 'preview');
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | OpportunityBand | 'coverage'>(
    'all',
  );
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return activeSnapshot.rows.filter((row) => {
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
  }, [activeSnapshot.rows, filter, query]);

  const loadFullDataset = async () => {
    setDatasetState('loading');
    setDatasetError(null);
    try {
      const [response, compression] = await Promise.all([
        fetch('/data/webmcp-index.json.gz'),
        import('fflate'),
      ]);
      if (!response.ok)
        throw new Error(`Download failed (${response.status}).`);
      const compressed = new Uint8Array(await response.arrayBuffer());
      const decoded = compression.strFromU8(compression.gunzipSync(compressed));
      const full = JSON.parse(decoded) as WebIndexSnapshot;
      if (
        full.attemptedCount !== snapshot.attemptedCount ||
        full.rows.length !== full.attemptedCount
      ) {
        throw new Error('The downloaded snapshot failed its row-count check.');
      }
      setActiveSnapshot(full);
      setDatasetState('full');
    } catch (error) {
      setDatasetState('error');
      setDatasetError(
        error instanceof Error
          ? error.message
          : 'The full dataset did not load.',
      );
    }
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="eyebrow text-signal-ink">
              Frozen v1 score distribution
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              What the legacy heuristic grouped together
            </h2>
          </div>
          <p className="self-end text-sm leading-6 text-muted-foreground">
            WRI v1 combined source-observed workflow density, baseline friction,
            and a static-hint gap. Its control-volume and missing-evidence
            assumptions are known validity limits, so this visualization is
            preserved for audit—not promoted as the current scoring model.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <OpportunityLandscape snapshot={activeSnapshot} />
          <div className="instrument-card p-5">
            <p className="eyebrow">Opportunity bands</p>
            <div className="mt-5 space-y-5">
              {activeSnapshot.distribution.map(({ band, count }) => {
                const share = activeSnapshot.scoredCount
                  ? (count / activeSnapshot.scoredCount) * 100
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
            <p className="eyebrow">Audited exploratory results</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Inspect the frozen WRI v1 evidence
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Scores are uncalibrated source-only hypotheses. Equal scores share
              a dense score rank; popularity is shown separately and never
              resolves a tie. Collection failures remain visible.
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Database
              className="mt-0.5 size-5 text-signal-ink"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">
                {datasetState === 'full'
                  ? 'Full 100,000-record attempt log loaded'
                  : `${snapshot.publishedRowCount.toLocaleString()}-record review slice loaded`}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {datasetState === 'full'
                  ? 'Search and filters now cover every scheduled rank, including quarantined collection errors.'
                  : 'The embedded slice is deliberately small and not representative. Load the full compressed artifact for complete search.'}
              </p>
              {datasetError && (
                <p className="mt-1 text-xs text-destructive">{datasetError}</p>
              )}
            </div>
          </div>
          {datasetState !== 'full' && (
            <button
              type="button"
              onClick={() => void loadFullDataset()}
              disabled={datasetState === 'loading'}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-60"
            >
              {datasetState === 'loading' ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Database className="size-4" aria-hidden="true" />
              )}
              {datasetState === 'loading'
                ? 'Loading and verifying…'
                : 'Load all 100,000 records'}
            </button>
          )}
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
                  <th className="px-4 py-3">WRI v1 score</th>
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
                          {row.opportunityRank != null
                            ? `B${row.opportunityRank}`
                            : '—'}
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
          this browser dataset. {activeSnapshot.rows.length.toLocaleString()} of{' '}
          {snapshot.attemptedCount.toLocaleString()} scheduled records are
          currently loaded.
        </p>
      </section>
    </>
  );
}
