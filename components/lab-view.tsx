'use client';

import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  FlaskConical,
  Gauge,
  MousePointer2,
  Play,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Square,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';

import { useApp } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { DEMO_TASK, getDemoProduct } from '@/lib/demo';
import type { DemoProduct, JourneyRun } from '@/lib/types';

function formatDuration(ms: number) {
  if (ms < 1_000) return `${ms} ms`;
  return `${(ms / 1_000).toFixed(1)} s`;
}

function latestRunForMode(
  mode: 'baseline' | 'webmcp',
  active: JourneyRun | null,
  baseline: JourneyRun | null,
  webmcp: JourneyRun | null,
) {
  if (active?.mode === mode) return active;
  return mode === 'baseline' ? baseline : webmcp;
}

export function LabView() {
  const {
    demo,
    visibleProducts,
    cartProduct,
    lift,
    selectDemoMode,
    startDemoRun,
    searchDemoProducts,
    compareDemoProducts,
    addDemoProductToCart,
    finishDemoRun,
    recordHumanIntervention,
    recordUiInteraction,
    attemptCheckout,
    runControlledComparison,
    demoToolsAvailable,
  } = useApp();
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minimumRating, setMinimumRating] = useState('0');
  const [minimumBattery, setMinimumBattery] = useState('');
  const [noiseCanceling, setNoiseCanceling] = useState(false);
  const [selected, setSelected] = useState<string[]>(demo.comparedIds);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const filters = demo.filters;
    queueMicrotask(() => {
      setQuery(filters.query ?? '');
      setMaxPrice(filters.maxPrice?.toString() ?? '');
      setMinimumRating(filters.minimumRating?.toString() ?? '0');
      setMinimumBattery(filters.minimumBatteryHours?.toString() ?? '');
      setNoiseCanceling(Boolean(filters.features?.includes('noise_canceling')));
    });
  }, [demo.filters]);

  useEffect(() => {
    const comparedIds = [...demo.comparedIds];
    queueMicrotask(() => setSelected(comparedIds));
  }, [demo.comparedIds]);

  const activeOrLatest = latestRunForMode(
    demo.mode,
    demo.activeRun,
    demo.baselineRun,
    demo.webmcpRun,
  );

  const comparedProducts = useMemo(
    () =>
      demo.comparedIds
        .map((id) => getDemoProduct(id))
        .filter((product): product is DemoProduct => Boolean(product)),
    [demo.comparedIds],
  );

  const applyFilters = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (maxPrice)
      recordUiInteraction('Maximum price entered', `$${maxPrice}`, 'search');
    if (minimumRating && minimumRating !== '0')
      recordUiInteraction('Minimum rating entered', minimumRating, 'search');
    if (minimumBattery)
      recordUiInteraction(
        'Minimum battery entered',
        `${minimumBattery} hours`,
        'search',
      );
    if (noiseCanceling)
      recordUiInteraction(
        'Required feature selected',
        'Noise canceling',
        'search',
      );
    searchDemoProducts({
      query: query || undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minimumRating: minimumRating ? Number(minimumRating) : undefined,
      minimumBatteryHours: minimumBattery ? Number(minimumBattery) : undefined,
      features: noiseCanceling ? ['noise_canceling'] : undefined,
    });
    setNotice(
      'Visible catalog updated through the same search service used by the WebMCP tool.',
    );
  };

  const toggleSelected = (id: string, checked: boolean) => {
    const product = getDemoProduct(id);
    recordUiInteraction(
      checked
        ? `${product?.name ?? id} selected`
        : `${product?.name ?? id} deselected`,
      'Comparison selection changed.',
      'compare',
    );
    setSelected((current) =>
      checked
        ? [...new Set([...current, id])].slice(0, 4)
        : current.filter((item) => item !== id),
    );
  };

  const compare = () => {
    try {
      compareDemoProducts(selected);
      setNotice(
        `${selected.length} products are now visible in the comparison panel.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message.replace(/^[A-Z_]+:\s*/, '')
          : 'Select two to four products.',
      );
    }
  };

  const checkoutBoundary = () => {
    try {
      attemptCheckout();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message.replace(/^[A-Z_]+:\s*/, '')
          : 'Checkout is unavailable.',
      );
    }
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <section className="border-b border-border bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-chip border-paper/20 text-paper/65">
                <FlaskConical className="size-3" /> Controlled same-origin lab
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-signal">
                No purchase · Synthetic data
              </span>
            </div>
            <p className="eyebrow mt-7 text-signal">Same task. Same app.</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
              UI actions vs. WebMCP tools.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-paper/65">
              {DEMO_TASK.goal}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-paper/25 bg-paper/5 text-paper hover:bg-paper/10 hover:text-paper"
            onClick={runControlledComparison}
          >
            <Sparkles data-icon="inline-start" /> Replay both paths
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 lg:px-8">
        <section
          className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]"
          aria-labelledby="mode-heading"
        >
          <aside className="instrument-card p-5">
            <p className="eyebrow">Run control</p>
            <h2 id="mode-heading" className="mt-2 text-xl font-semibold">
              Choose a path
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1.5">
              <button
                className={`mode-button ${demo.mode === 'baseline' ? 'mode-button-active' : ''}`}
                onClick={() => {
                  selectDemoMode('baseline', false);
                  setSelected([]);
                  setNotice(null);
                }}
                aria-pressed={demo.mode === 'baseline'}
              >
                <MousePointer2 className="size-4" aria-hidden="true" /> Baseline
              </button>
              <button
                className={`mode-button ${demo.mode === 'webmcp' ? 'mode-button-active' : ''}`}
                onClick={() => {
                  selectDemoMode('webmcp', false);
                  setSelected([]);
                  setNotice(null);
                }}
                aria-pressed={demo.mode === 'webmcp'}
              >
                <Wrench className="size-4" aria-hidden="true" /> WebMCP
              </button>
            </div>
            <div className="mt-5 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {demo.mode === 'baseline' ? (
                  <UserRound className="size-4" />
                ) : (
                  <Bot className="size-4" />
                )}
                {demo.mode === 'baseline'
                  ? 'UI-only action surface'
                  : 'Structured tools enabled'}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {demo.mode === 'baseline'
                  ? 'The accessible human interface remains fully functional. Demo search, compare, and cart tools are unregistered.'
                  : `The identical interface remains available while three structured task tools are registered${demoToolsAvailable ? ' in this browser' : ' when registration succeeds in a compatible browser'}.`}
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              {!demo.activeRun ? (
                <Button
                  className="h-10"
                  onClick={() => {
                    startDemoRun();
                    setNotice(
                      'Run started. Complete the task using the visible UI or a compatible site-tools agent.',
                    );
                  }}
                >
                  <Play data-icon="inline-start" /> Start{' '}
                  {demo.mode === 'baseline' ? 'baseline' : 'WebMCP'} run
                </Button>
              ) : (
                <Button
                  className="h-10 bg-signal-ink text-white hover:bg-signal-ink/85"
                  onClick={() => {
                    const run = finishDemoRun();
                    setNotice(
                      run.success
                        ? 'Run completed: every deterministic assertion passed.'
                        : 'Run completed with unmet assertions.',
                    );
                  }}
                >
                  <Square data-icon="inline-start" /> Finish and verify
                </Button>
              )}
              <Button
                variant="outline"
                disabled={!demo.activeRun}
                onClick={recordHumanIntervention}
              >
                <UserRound data-icon="inline-start" /> Record human assist
              </Button>
            </div>
            {activeOrLatest && (
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 text-xs">
                <div>
                  <dt className="text-muted-foreground">UI actions</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {activeOrLatest.uiActionCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tool calls</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {activeOrLatest.webmcpCallCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Rejected</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {activeOrLatest.invalidAttemptCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Human assists</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {activeOrLatest.humanInterventionCount}
                  </dd>
                </div>
              </dl>
            )}
          </aside>

          <section
            className="instrument-card p-5 sm:p-6"
            aria-labelledby="catalog-heading"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Identical human interface</p>
                <h2 id="catalog-heading" className="mt-2 text-xl font-semibold">
                  Synthetic headset catalog
                </h2>
              </div>
              <span className="status-chip">
                <span className="size-1.5 rounded-full bg-positive" />{' '}
                {visibleProducts.length} visible
              </span>
            </div>
            <form
              className="mt-6 grid gap-3 rounded-xl border border-border bg-muted/45 p-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_.7fr_.8fr_auto]"
              onSubmit={applyFilters}
            >
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold"
                  htmlFor="product-query"
                >
                  Search
                </label>
                <Input
                  id="product-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="headset or maker"
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold"
                  htmlFor="max-price"
                >
                  Max price
                </label>
                <Input
                  id="max-price"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold"
                  htmlFor="min-rating"
                >
                  Min rating
                </label>
                <NativeSelect
                  className="w-full"
                  id="min-rating"
                  value={minimumRating}
                  onChange={(event) => setMinimumRating(event.target.value)}
                >
                  <NativeSelectOption value="0">Any</NativeSelectOption>
                  <NativeSelectOption value="4.5">4.5+</NativeSelectOption>
                  <NativeSelectOption value="4.7">4.7+</NativeSelectOption>
                </NativeSelect>
              </div>
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold"
                  htmlFor="min-battery"
                >
                  Min battery
                </label>
                <Input
                  id="min-battery"
                  type="number"
                  min="0"
                  value={minimumBattery}
                  onChange={(event) => setMinimumBattery(event.target.value)}
                />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <Checkbox
                    id="noise-canceling"
                    aria-label="Noise canceling"
                    checked={noiseCanceling}
                    onCheckedChange={(checked) =>
                      setNoiseCanceling(checked === true)
                    }
                  />
                  <span aria-hidden="true">Noise canceling</span>
                </div>
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </div>
            </form>
            {notice && (
              <output
                className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-5 text-muted-foreground"
                aria-live="polite"
              >
                <CircleAlert
                  className="mt-0.5 size-3.5 shrink-0 text-signal-ink"
                  aria-hidden="true"
                />{' '}
                {notice}
              </output>
            )}
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const isSelected = selected.includes(product.id);
                return (
                  <article
                    key={product.id}
                    className={`product-card ${isSelected ? 'product-card-selected' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="block size-9 rounded-full border-4 border-card shadow-sm"
                        style={{ backgroundColor: product.color }}
                        aria-hidden="true"
                      />
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Checkbox
                          id={`compare-${product.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleSelected(product.id, checked === true)
                          }
                          aria-label={`Select ${product.name} to compare`}
                        />
                        <span aria-hidden="true">Compare</span>
                      </div>
                    </div>
                    <p className="mt-5 text-xs text-muted-foreground">
                      {product.maker}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {product.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                      {product.summary}
                    </p>
                    <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Price</dt>
                        <dd className="mt-1 font-semibold">${product.price}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Rating</dt>
                        <dd className="mt-1 font-semibold">{product.rating}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Battery</dt>
                        <dd className="mt-1 font-semibold">
                          {product.batteryHours}h
                        </dd>
                      </div>
                    </dl>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      disabled={!demo.comparedIds.includes(product.id)}
                      title={
                        demo.comparedIds.includes(product.id)
                          ? undefined
                          : 'Compare this product before adding it to the cart.'
                      }
                      onClick={() => {
                        addDemoProductToCart(product.id);
                        setNotice(
                          `${product.name} added to the synthetic cart. No transaction occurred.`,
                        );
                      }}
                    >
                      <ShoppingCart data-icon="inline-start" /> Add to demo cart
                    </Button>
                  </article>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">
                {selected.length} selected · compare 2–4 stable product IDs
              </p>
              <Button
                variant="outline"
                disabled={selected.length < 2 || selected.length > 4}
                onClick={compare}
              >
                Compare selected <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </section>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <div className="instrument-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Visible state</p>
                <h2 className="mt-2 text-xl font-semibold">Comparison</h2>
              </div>
              <span className="status-chip">
                {comparedProducts.length || 0} compared
              </span>
            </div>
            {comparedProducts.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-3 pr-4">Product</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Battery</th>
                      <th className="px-4 py-3">Task fit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparedProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <span className="font-semibold">{product.name}</span>
                          {index === 0 && (
                            <span className="ml-2 rounded-full bg-signal/25 px-2 py-0.5 text-[10px] font-semibold text-signal-ink">
                              Top match
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">${product.price}</td>
                        <td className="px-4 py-4">{product.rating}</td>
                        <td className="px-4 py-4">{product.batteryHours}h</td>
                        <td className="px-4 py-4">
                          {product.price <= 300 &&
                          product.rating >= 4.5 &&
                          product.batteryHours >= 30 &&
                          product.features.includes('noise_canceling') ? (
                            <span className="inline-flex items-center gap-1 text-positive">
                              <Check className="size-3" /> Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <X className="size-3" /> Miss
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Select and compare two eligible products. This panel is updated
                by either path.
              </div>
            )}
          </div>

          <aside className="instrument-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Confirmation boundary</p>
                <h2 className="mt-2 text-xl font-semibold">Synthetic cart</h2>
              </div>
              <ShoppingCart
                className="size-5 text-signal-ink"
                aria-hidden="true"
              />
            </div>
            {cartProduct ? (
              <div className="mt-5 rounded-xl border border-positive/20 bg-positive/7 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-positive">
                  <CheckCircle2 className="size-4" /> Visible cart state
                  verified
                </div>
                <p className="mt-4 text-lg font-semibold">{cartProduct.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {demo.cartQuantity} × ${cartProduct.price} · synthetic only
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No product in the demo cart.
              </div>
            )}
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={checkoutBoundary}
            >
              <ShieldCheck data-icon="inline-start" /> Test checkout boundary
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Checkout is intentionally unsupported. The action fails closed and
              records a rejected attempt.
            </p>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
          <div className="instrument-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Observed events</p>
                <h2 className="mt-2 text-xl font-semibold">Run timeline</h2>
              </div>
              {activeOrLatest?.completedAt ? (
                <span className="status-chip">
                  <CheckCircle2 className="size-3 text-positive" /> Completed
                </span>
              ) : (
                <span className="status-chip">
                  <Circle className="size-3" />{' '}
                  {activeOrLatest ? 'Active' : 'Idle'}
                </span>
              )}
            </div>
            {activeOrLatest?.events.length ? (
              <ol className="mt-6 space-y-0">
                {activeOrLatest.events.map((event, index) => (
                  <li
                    key={event.id}
                    className="relative grid grid-cols-[52px_16px_1fr] gap-3 pb-5 last:pb-0"
                  >
                    <span className="pt-0.5 font-mono text-[10px] text-muted-foreground">
                      +{formatDuration(event.atMs)}
                    </span>
                    <span className="relative z-10 mt-1 block size-2.5 rounded-full border-2 border-card bg-signal-ink ring-2 ring-border" />
                    {index < activeOrLatest.events.length - 1 && (
                      <span
                        className="absolute bottom-0 left-[62px] top-3 w-px bg-border"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{event.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {event.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Start a run or replay both paths to populate observed evidence.
              </div>
            )}
          </div>

          <div className="rounded-xl bg-ink p-5 text-paper sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-signal">Signature metric</p>
                <h2 className="mt-2 text-2xl font-semibold">WebMCP Lift</h2>
              </div>
              <div className="text-right">
                <span className="block text-5xl font-semibold tabular-nums tracking-[-.06em]">
                  {lift?.value !== null && lift
                    ? `${lift.value > 0 ? '+' : ''}${lift.value}`
                    : '—'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-paper/50">
                  −100 to +100
                </span>
              </div>
            </div>
            {lift ? (
              <>
                <p className="mt-5 text-lg font-medium text-signal">
                  {lift.interpretation}
                </p>
                <p className="mt-2 text-sm leading-6 text-paper/60">
                  {lift.limitation}
                </p>
                <div className="mt-6 space-y-3">
                  {lift.components.map((component) => (
                    <div
                      key={component.id}
                      className="grid grid-cols-[1fr_65px_65px] items-center gap-3 border-t border-paper/15 pt-3 text-sm"
                    >
                      <span>{component.label}</span>
                      <span className="text-right font-mono text-xs text-paper/55">
                        {Math.round(component.weight * 100)}%
                      </span>
                      <span className="text-right font-semibold tabular-nums">
                        {component.comparable
                          ? `${component.value >= 0 ? '+' : ''}${Math.round(component.value * 100)}%`
                          : 'N/C'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[lift.baseline, lift.webmcp].map((run) => (
                    <div
                      key={run.id}
                      className="rounded-lg border border-paper/15 bg-paper/5 p-4"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-wider text-paper/50">
                        {run.mode}
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {run.uiActionCount + run.webmcpCallCount} actions
                      </p>
                      <p className="mt-1 text-xs text-paper/55">
                        {formatDuration(run.elapsedMs)} ·{' '}
                        {run.success ? 'success' : 'failed'} ·{' '}
                        {run.path.replace('_', ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-paper/20 p-8 text-center">
                <Gauge
                  className="mx-auto size-7 text-paper/45"
                  aria-hidden="true"
                />
                <p className="mt-4 font-semibold">Awaiting comparison</p>
                <p className="mt-2 text-sm leading-6 text-paper/55">
                  Complete the same task once in each mode, or run the labeled
                  deterministic replay.
                </p>
              </div>
            )}
            <details className="mt-6 border-t border-paper/15 pt-4 text-xs text-paper/55">
              <summary className="cursor-pointer font-semibold text-paper/80">
                Published formula
              </summary>
              <p className="mt-3 leading-6">
                100 × (40% success delta + 20% action reduction + 15% elapsed
                reduction + 10% retry reduction + 10% human-intervention
                reduction + 5% verification delta). Efficiency is non-comparable
                when either run fails.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
