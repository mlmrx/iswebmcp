import type { Metadata } from 'next';
import {
  ArrowDown,
  Braces,
  Layers3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { DemoGallery } from '@/components/demos/demo-gallery';
import { Button } from '@/components/ui/button';
import {
  demoCategories,
  demoCategoryDetails,
  demoScenarios,
  type DemoCategory,
} from '@/lib/demos';

export const metadata: Metadata = {
  title: 'Interactive WebMCP pattern gallery',
  description:
    'Explore 24 honestly labeled synthetic WebMCP patterns covering value, contract design, security, reliability, verification, and confirmation boundaries.',
  alternates: { canonical: '/demos' },
  openGraph: {
    title: 'Interactive WebMCP pattern gallery · isWebMCP',
    description:
      'Before-and-after flows, tool contracts, verification states, and human confirmation boundaries.',
    type: 'website',
    url: '/demos',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP interactive pattern gallery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive WebMCP pattern gallery · isWebMCP',
    description:
      'Explore synthetic before-and-after patterns without invented performance claims.',
    images: ['/og.png'],
  },
};

const categoryIcons: Record<DemoCategory, typeof Sparkles> = {
  value: Sparkles,
  contract: Braces,
  security: ShieldCheck,
  reliability: Layers3,
};

export default function DemosPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <section className="border-b border-border bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-18">
          <div className="grid gap-9 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-chip border-paper/20 text-paper/70">
                  {demoScenarios.length} interactive patterns
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-signal">
                  Synthetic fixtures · no performance claims
                </span>
              </div>
              <p className="eyebrow mt-8 text-signal">
                WebMCP difference gallery
              </p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
                See the contract, state change, and safety boundary.
              </h1>
            </div>
            <div>
              <p className="max-w-xl text-lg leading-8 text-paper/65">
                Move through the same task before and after an explicit tool
                contract. Inspect example inputs and results, watch verification
                state change, and test where human review belongs.
              </p>
              <Button
                nativeButton={false}
                className="mt-7 bg-signal text-ink hover:bg-signal/85"
                render={<Link href="#demo-workbench" />}
              >
                Explore the patterns <ArrowDown data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-b border-border bg-card/65"
        aria-label="Demo categories"
      >
        <div className="mx-auto grid max-w-7xl gap-px bg-border px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {demoCategories.map((category) => {
            const Icon = categoryIcons[category];
            const count = demoScenarios.filter(
              (scenario) => scenario.category === category,
            ).length;
            return (
              <article key={category} className="bg-card px-5 py-6 lg:px-6">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="size-5 text-signal-ink" aria-hidden="true" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {count} patterns
                  </span>
                </div>
                <h2 className="mt-6 font-semibold">
                  {demoCategoryDetails[category].label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {demoCategoryDetails[category].description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <DemoGallery scenarios={demoScenarios} />
    </main>
  );
}
