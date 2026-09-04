'use client';

import {
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  FlaskConical,
  MousePointer2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { CONTROLLED_REPLAY_FACTS } from '@/lib/demo';

const baselineSteps = [
  'Enter a maximum price',
  'Choose a minimum rating',
  'Enter minimum battery life',
  'Select noise canceling',
  'Apply the filters',
  'Inspect the result cards',
  'Select two eligible products',
  'Open the comparison',
  'Add the best match to the cart',
  'Inspect the cart to verify the result',
];

const toolSteps = [
  {
    name: 'search_demo_products',
    detail: '{ maxPrice: 300, rating: 4.5, battery: 30, noiseCanceling: true }',
  },
  {
    name: 'compare_demo_products',
    detail: '{ ids: ["aurora-q45", "sonic-arc"] }',
  },
  {
    name: 'add_demo_product_to_cart',
    detail: '{ id: "aurora-q45" }',
  },
  {
    name: 'finish_demo_run',
    detail: '{ verify: true }',
  },
];

function formatReplayDuration(milliseconds: number) {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

export function ProofFirstHero() {
  const [activePath, setActivePath] = useState<'baseline' | 'webmcp'>(
    'baseline',
  );
  const isBaseline = activePath === 'baseline';
  const activeFacts = CONTROLLED_REPLAY_FACTS[activePath];

  return (
    <section className="overflow-hidden border-b border-paper/12 bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-xs font-medium text-paper/70">
            <span className="size-1.5 rounded-full bg-signal" />
            Same task · same app · two action surfaces
          </div>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[.96] tracking-[-.06em] sm:text-5xl lg:text-6xl">
            AI agents shouldn&apos;t have to guess where to click.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-paper/68 sm:text-lg">
            WebMCP lets a website expose actions like search, compare, and add
            to cart as typed tools. isWebMCP shows what changes—and checks
            whether the result can actually be verified.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              nativeButton={false}
              size="lg"
              className="h-11 bg-signal text-ink hover:bg-signal/85"
              render={<Link href="/lab" />}
            >
              <FlaskConical data-icon="inline-start" /> Run the live proof lab
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-11 border-paper/20 bg-paper/5 text-paper hover:bg-paper/10 hover:text-paper"
              render={<Link href="#audit" />}
            >
              Audit your website <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          <div className="mt-6 hidden rounded-xl border border-paper/15 bg-paper/5 p-4 lg:block">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-signal">
              The task
            </p>
            <p className="mt-2 text-sm leading-6 text-paper/80">
              Find the best noise-canceling headset under $300, compare two, add
              one to the cart, and stop before checkout.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Under $300',
                '30+ hour battery',
                'Compare two',
                'No checkout',
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-paper/12 bg-ink/35 px-2.5 py-1 text-[11px] text-paper/65"
                >
                  <Check className="size-3 text-signal" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 hidden max-w-xl text-xs leading-5 text-paper/45 lg:block">
            WebMCP is an experimental Community Group proposal. This comparison
            uses synthetic products and an authored replay; it does not claim a
            universal performance gain.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-paper/15 bg-[#f7f8f1] text-ink shadow-[0_30px_90px_rgb(0_0_0/.32)]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-ink/45">
                Controlled comparison
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                What changes when the page exposes intent?
              </h2>
              <p className="mt-1 text-[11px] text-ink/45 lg:hidden">
                Synthetic headset task · find, compare, cart, then stop
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-2.5 py-1 text-[10px] font-semibold text-ink/55">
              <span className="size-1.5 rounded-full bg-warning" /> Authored
              replay
            </span>
          </div>

          <div
            className="grid grid-cols-2 border-b border-ink/10 bg-ink/[.035] p-1.5"
            role="tablist"
            aria-label="Compare UI-only and WebMCP paths"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isBaseline}
              aria-controls="hero-path-panel"
              className={`rounded-lg px-3 py-3 text-left transition ${
                isBaseline
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink/50 hover:text-ink'
              }`}
              onClick={() => setActivePath('baseline')}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <MousePointer2 className="size-3.5" aria-hidden="true" />
                Without WebMCP
              </span>
              <span className="mt-1 block font-mono text-[10px] text-ink/45">
                {CONTROLLED_REPLAY_FACTS.baseline.actionCount} UI actions
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isBaseline}
              aria-controls="hero-path-panel"
              className={`rounded-lg px-3 py-3 text-left transition ${
                !isBaseline
                  ? 'bg-signal text-ink shadow-sm'
                  : 'text-ink/50 hover:text-ink'
              }`}
              onClick={() => setActivePath('webmcp')}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Braces className="size-3.5" aria-hidden="true" /> With WebMCP
              </span>
              <span className="mt-1 block font-mono text-[10px] text-ink/55">
                {CONTROLLED_REPLAY_FACTS.webmcp.actionCount} typed calls
              </span>
            </button>
          </div>

          <div
            id="hero-path-panel"
            role="tabpanel"
            aria-live="polite"
            className="p-4 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">
                  {isBaseline
                    ? 'The agent must operate the interface'
                    : 'The page declares exactly what can be done'}
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  {isBaseline
                    ? 'Every step depends on discovering and interpreting UI state.'
                    : 'Inputs are checked, results use stable IDs, and the cart remains visible.'}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-ink/55">
                {formatReplayDuration(activeFacts.elapsedMs)}
              </span>
            </div>

            {isBaseline ? (
              <ol className="mt-5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {baselineSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 rounded-lg border border-ink/8 bg-white/70 px-3 py-2 text-xs leading-5"
                  >
                    <span className="mt-0.5 font-mono text-[9px] text-ink/35">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ol className="mt-5 space-y-2">
                {toolSteps.map((step, index) => (
                  <li
                    key={step.name}
                    className="rounded-lg border border-ink/10 bg-ink px-3.5 py-3 text-paper"
                  >
                    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-signal">
                      <span className="text-paper/35">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {step.name}
                    </div>
                    <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[9px] text-paper/45">
                      {step.detail}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-5 rounded-xl border border-positive/20 bg-positive/[.07] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-positive"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold">Aurora Q45 selected</p>
                    <p className="mt-1 text-xs text-ink/55">
                      Same visible cart result through either path.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-positive">
                    {CONTROLLED_REPLAY_FACTS.assertionCount}/
                    {CONTROLLED_REPLAY_FACTS.assertionCount}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink/45">
                    task checks pass
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-positive/15 pt-3 text-[11px] text-ink/55">
                <ShieldCheck
                  className="size-3.5 text-positive"
                  aria-hidden="true"
                />
                Checkout was not attempted. The safety boundary held.
              </div>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-ink/25"
              onClick={() => setActivePath(isBaseline ? 'webmcp' : 'baseline')}
            >
              {isBaseline
                ? 'Now show the WebMCP path'
                : 'Compare the UI-only path'}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
