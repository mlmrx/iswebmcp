'use client';

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  CheckCircle2,
  FlaskConical,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { ContractPreview } from '@/components/demos/contract-preview';
import { FlowComparison } from '@/components/demos/flow-comparison';
import { Button } from '@/components/ui/button';
import {
  demoCategories,
  demoCategoryDetails,
  type DemoCategory,
  type DemoScenario,
} from '@/lib/demos';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | DemoCategory;

const categoryIcons: Record<DemoCategory, typeof Sparkles> = {
  value: Sparkles,
  contract: Braces,
  security: ShieldCheck,
  reliability: Layers3,
};

const categoryTone: Record<DemoCategory, string> = {
  value: 'border-signal-ink/25 bg-signal/10 text-signal-ink',
  contract: 'border-sky-600/20 bg-sky-500/10 text-sky-800',
  security: 'border-amber-600/20 bg-amber-500/10 text-amber-800',
  reliability: 'border-violet-600/20 bg-violet-500/10 text-violet-800',
};

export function DemoGallery({
  scenarios,
}: {
  scenarios: readonly DemoScenario[];
}) {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState(scenarios[0]?.slug ?? '');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      if (category !== 'all' && scenario.category !== category) return false;
      if (!normalized) return true;
      return `${scenario.title} ${scenario.summary} ${scenario.eyebrow} ${scenario.tool.name}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [category, query, scenarios]);

  const selected =
    filtered.find((scenario) => scenario.slug === selectedSlug) ?? filtered[0];
  const selectedIndex = selected ? filtered.indexOf(selected) : -1;

  const chooseCategory = (next: CategoryFilter) => {
    setCategory(next);
    const first = scenarios.find(
      (scenario) => next === 'all' || scenario.category === next,
    );
    if (first) setSelectedSlug(first.slug);
  };

  const chooseScenario = (slug: string) => {
    setSelectedSlug(slug);
  };

  const SelectedCategoryIcon = selected
    ? categoryIcons[selected.category]
    : Sparkles;

  return (
    <section
      id="demo-workbench"
      className="mx-auto max-w-7xl px-5 py-12 lg:px-8"
    >
      <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow text-signal-ink">Pattern library</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            Explore one boundary at a time.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Every pattern is a synthetic teaching fixture. The flows demonstrate
            contract shape and verification logic; they do not claim measured
            agent speed, success, or production compatibility.
          </p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patterns or tool names"
            aria-label="Search demo patterns"
            className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
        </div>
      </div>

      <div
        className="mt-6 flex flex-wrap gap-2"
        role="toolbar"
        aria-label="Filter demo patterns"
      >
        <button
          type="button"
          className={cn(
            'rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            category === 'all'
              ? 'border-ink bg-ink text-paper'
              : 'border-border bg-card hover:bg-muted',
          )}
          aria-pressed={category === 'all'}
          onClick={() => chooseCategory('all')}
        >
          All {scenarios.length}
        </button>
        {demoCategories.map((item) => {
          const Icon = categoryIcons[item];
          const count = scenarios.filter(
            (scenario) => scenario.category === item,
          ).length;
          return (
            <button
              key={item}
              type="button"
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                category === item
                  ? categoryTone[item]
                  : 'border-border bg-card hover:bg-muted',
              )}
              aria-pressed={category === item}
              onClick={() => chooseCategory(item)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {demoCategoryDetails[item].label} {count}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <aside
            className="space-y-4 xl:sticky xl:top-24"
            aria-label="Demo scenario selection"
          >
            <div className="xl:hidden">
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="demo-scenario-select"
              >
                Choose a pattern
              </label>
              <select
                id="demo-scenario-select"
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base md:text-sm"
                value={selected.slug}
                onChange={(event) => chooseScenario(event.target.value)}
              >
                {filtered.map((scenario) => (
                  <option key={scenario.slug} value={scenario.slug}>
                    {demoCategoryDetails[scenario.category].label}:{' '}
                    {scenario.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden max-h-[calc(100vh-9rem)] space-y-2 overflow-y-auto pr-2 xl:block">
              {filtered.map((scenario, index) => {
                const Icon = categoryIcons[scenario.category];
                const active = scenario.slug === selected.slug;
                return (
                  <button
                    key={scenario.slug}
                    type="button"
                    className={cn(
                      'w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active
                        ? 'border-signal-ink/35 bg-signal/10'
                        : 'border-border bg-card hover:bg-muted/50',
                    )}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => chooseScenario(scenario.slug)}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Icon className="size-3.5" aria-hidden="true" />
                        {demoCategoryDetails[scenario.category].label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm font-semibold leading-5">
                      {scenario.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <article
            className="min-w-0 space-y-6"
            aria-labelledby="selected-demo-heading"
          >
            <div className="instrument-card overflow-hidden">
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        categoryTone[selected.category],
                      )}
                    >
                      <SelectedCategoryIcon
                        className="size-3.5"
                        aria-hidden="true"
                      />
                      {demoCategoryDetails[selected.category].label}
                    </span>
                    <span className="status-chip">
                      <FlaskConical className="size-3.5" aria-hidden="true" />
                      Illustrative · synthetic
                    </span>
                  </div>
                  <p className="eyebrow mt-6">{selected.eyebrow}</p>
                  <h3
                    id="selected-demo-heading"
                    className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.04em]"
                  >
                    {selected.title}
                  </h3>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                    {selected.summary}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Previous pattern"
                    disabled={selectedIndex <= 0}
                    onClick={() => {
                      const previous = filtered[selectedIndex - 1];
                      if (previous) chooseScenario(previous.slug);
                    }}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Next pattern"
                    disabled={
                      selectedIndex < 0 || selectedIndex >= filtered.length - 1
                    }
                    onClick={() => {
                      const next = filtered[selectedIndex + 1];
                      if (next) chooseScenario(next.slug);
                    }}
                  >
                    <ArrowRight />
                  </Button>
                </div>
              </div>
              <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
                <div className="bg-card p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2
                      className="size-4 text-positive"
                      aria-hidden="true"
                    />
                    Design lesson
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selected.lesson}
                  </p>
                </div>
                <div className="bg-card p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Wrench
                      className="size-4 text-warning"
                      aria-hidden="true"
                    />
                    Failure mode
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selected.risk}
                  </p>
                </div>
              </div>
            </div>

            <FlowComparison key={`${selected.slug}-flow`} scenario={selected} />
            <ContractPreview
              key={`${selected.slug}-contract`}
              contract={selected.tool}
            />

            <div className="rounded-xl border border-dashed border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Evidence status:</strong>{' '}
              {selected.evidenceLabel}. This pattern documents a design target
              and its verification seam. It is not a claim about third-party
              sites, browser support, agent selection reliability, or measured
              lift.
            </div>
          </article>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <output className="block" aria-live="polite">
            <Search
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="mt-4 block text-xl font-semibold tracking-[-.02em]">
              No illustrative patterns match
            </span>
            <span className="mx-auto mt-2 block max-w-md text-sm leading-6 text-muted-foreground">
              Try a broader search or reset the category to explore all 24
              synthetic teaching fixtures.
            </span>
          </output>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => {
              setQuery('');
              chooseCategory('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}
