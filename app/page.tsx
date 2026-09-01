import {
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  CircleDashed,
  Eye,
  FlaskConical,
  Gauge,
  Layers3,
  MousePointer2,
  Radar,
  RadioTower,
  ShieldCheck,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { QuickScanForm } from '@/components/quick-scan-form';
import { Button } from '@/components/ui/button';
import { learningArticles } from '@/lib/content';
import { formatPulseDate, pulseUpdates } from '@/lib/pulse';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': '/feed.xml' },
  },
};

const proofSteps = [
  [
    '01',
    'Detect',
    'Map source-visible actions and separate WebMCP hints from runtime proof.',
  ],
  [
    '02',
    'Test',
    'Inspect contracts and run a representative journey against explicit assertions.',
  ],
  [
    '03',
    'Prove',
    'Compare observed outcomes with a published, reversible scoring formula.',
  ],
];

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background text-foreground"
    >
      <section
        id="top"
        className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,.95fr)] lg:px-8 lg:py-20"
      >
        <div className="flex flex-col justify-center">
          <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-signal" />
            Evidence lab for the agent-native web
          </div>
          <p className="mb-3 font-mono text-sm font-medium text-signal-ink">
            isWebMCP(url) &rarr; ?
          </p>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Is your web app truly WebMCP ready?
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Paste a public URL to inspect its action surface, find WebMCP
            opportunities, and see what still needs proof.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium">
            <span>Detect it.</span>
            <ArrowRight
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Test it.</span>
            <ArrowRight
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-signal-ink">Prove it.</span>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-10"
              render={<Link href="/lab" />}
            >
              <FlaskConical data-icon="inline-start" /> Watch the before/after
              demo
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="ghost"
              className="h-10"
              render={<Link href="/methodology" />}
            >
              Read methodology <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <QuickScanForm />
      </section>

      <section className="border-y border-border bg-card/75">
        <div className="mx-auto grid max-w-7xl divide-y divide-border px-5 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {proofSteps.map(([number, title, description]) => (
            <article
              key={number}
              className="py-7 md:px-7 md:first:pl-0 md:last:pr-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-signal-ink">
                  {number}
                </span>
                <CircleDashed
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <h2 className="mt-7 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-16 lg:px-8"
        aria-labelledby="result-preview"
      >
        <div className="grid gap-8 lg:grid-cols-[.68fr_1.32fr] lg:items-center">
          <div>
            <p className="eyebrow text-signal-ink">The report is the product</p>
            <h2
              id="result-preview"
              className="mt-3 text-4xl font-semibold tracking-[-.05em]"
            >
              One URL. A ledger of what is known.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Quick Scan is intentionally conservative. It analyzes public
              source, maps candidate actions, and ranks next steps—while
              refusing to invent runtime proof it cannot observe.
            </p>
            <ul className="mt-7 space-y-3 text-sm">
              {[
                'Every finding links back to exact, sanitized evidence.',
                'Unknown runtime quality stays unknown—not zero.',
                'Source, runtime, imported, measured, and inferred evidence never blur together.',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-positive"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="instrument-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sample report
                </p>
                <p className="mt-1 font-semibold">demo.iswebmcp.com/store</p>
              </div>
              <span className="status-chip">
                <span className="size-1.5 rounded-full bg-warning" /> Source
                hint detected
              </span>
            </div>
            <div className="grid gap-px bg-border md:grid-cols-3">
              {[
                ['82', 'Baseline actionability', '100% source coverage'],
                ['—', 'WebMCP quality', 'Runtime unknown'],
                ['—', 'WebMCP Lift', 'Awaiting runs'],
              ].map(([value, label, detail]) => (
                <div key={label} className="bg-card p-5">
                  <span className="text-4xl font-semibold tracking-[-.06em]">
                    {value}
                  </span>
                  <p className="mt-6 text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold">Action surface</span>
                <span className="text-muted-foreground">
                  3 source candidates
                </span>
              </div>
              {['Search', 'Compare', 'Add'].map((action) => (
                <div
                  key={action}
                  className="grid grid-cols-[1fr_70px_74px] items-center gap-3 border-t border-border py-3 text-xs"
                >
                  <span className="font-medium">{action}</span>
                  <span className="coverage-pill coverage-yes">Human UI</span>
                  <span className="coverage-pill coverage-inferred">
                    Inferred
                  </span>
                </div>
              ))}
              <Button
                nativeButton={false}
                variant="outline"
                className="mt-3 w-full"
                render={<Link href="/methodology" />}
              >
                See how evidence is scored <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
          <div>
            <p className="eyebrow text-signal">Challenge-defining proof</p>
            <h2 className="mt-3 max-w-md text-4xl font-semibold tracking-[-.05em]">
              Same task. Same app. Two paths.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-paper/65">
              The proof lab uses one synthetic catalog and one business-logic
              layer. Only the action surface changes.
            </p>
            <Button
              nativeButton={false}
              className="mt-7 bg-signal text-ink hover:bg-signal/85"
              render={<Link href="/lab" />}
            >
              Run the proof lab <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-paper/15 bg-paper/5 p-6">
              <div className="flex items-center justify-between">
                <MousePointer2
                  className="size-5 text-paper/70"
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
                  Baseline
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">UI-only journey</h3>
              <p className="mt-2 text-sm leading-6 text-paper/55">
                Search → set filters → inspect → select → compare → add. Fully
                accessible and intentionally tool-free.
              </p>
            </article>
            <article className="rounded-xl border border-signal/35 bg-signal/8 p-6">
              <div className="flex items-center justify-between">
                <Braces className="size-5 text-signal" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal">
                  WebMCP
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">Structured journey</h3>
              <p className="mt-2 text-sm leading-6 text-paper/55">
                Search with constraints → compare stable IDs → update the same
                cart → verify visible state.
              </p>
            </article>
            <div className="sm:col-span-2 rounded-xl border border-paper/15 bg-paper/5 p-6">
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-signal">
                    WebMCP Lift
                  </p>
                  <p className="mt-2 text-sm leading-6 text-paper/55">
                    Success, actions, elapsed time, retries, human intervention,
                    and assertion coverage combine into a transparent −100 to
                    +100 result.
                  </p>
                </div>
                <Gauge className="size-10 text-signal" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="eyebrow">Presence ≠ readiness</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em]">
              Four states worth separating.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            {[
              [Radar, 'Present', 'A source hint or registered object exists.'],
              [
                Layers3,
                'Ready',
                'Contracts are narrow, distinct, state-aware, and safe.',
              ],
              [
                Eye,
                'Successful',
                'A representative journey reaches its observable postconditions.',
              ],
              [
                ShieldCheck,
                'Safe',
                'The same journey respects authorization, confirmation, and data boundaries.',
              ],
            ].map(([Icon, title, detail]) => {
              const C = Icon as typeof Radar;
              return (
                <article key={title as string} className="bg-card p-6">
                  <C className="size-5 text-signal-ink" aria-hidden="true" />
                  <h3 className="mt-7 font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {detail as string}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/70">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.62fr_1.38fr]">
            <div>
              <p className="eyebrow text-signal-ink">Learn + monitor</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.05em]">
                The field guide now lives beside the lab.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
                Build from source-linked explainers and how-tos, then follow
                meaningful WebMCP changes without mixing them up with broader
                MCP ecosystem news.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button nativeButton={false} render={<Link href="/learn" />}>
                  <BookOpen data-icon="inline-start" /> Open learning center
                </Button>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link href="/pulse" />}
                >
                  <RadioTower data-icon="inline-start" /> View latest pulse
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {learningArticles.slice(0, 2).map((article) => (
                <article key={article.slug} className="instrument-card p-5">
                  <span className="source-badge">
                    {article.kind.replace('-', ' ')}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {article.dek}
                  </p>
                  <Link
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                    href={`/learn/${article.slug}`}
                  >
                    Read {article.minutes}-minute guide{' '}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
              <article className="instrument-card p-5 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="source-badge">Latest signal</span>
                  <time
                    className="font-mono text-[10px] text-muted-foreground"
                    dateTime={pulseUpdates[0]?.publishedAt}
                  >
                    {pulseUpdates[0]
                      ? formatPulseDate(pulseUpdates[0].publishedAt)
                      : ''}
                  </time>
                </div>
                <h3 className="mt-5 text-xl font-semibold">
                  {pulseUpdates[0]?.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {pulseUpdates[0]?.summary}
                </p>
                <Link
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  href="/pulse"
                >
                  See source and challenge tracker{' '}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
