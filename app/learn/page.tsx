import type { Metadata } from 'next';
import { ArrowRight, BookOpen, CircleHelp, RadioTower } from 'lucide-react';
import Link from 'next/link';

import { ContentExplorer } from '@/components/content-explorer';
import { Button } from '@/components/ui/button';
import {
  formatContentDate,
  frequentlyAskedQuestions,
  learningArticles,
} from '@/lib/content';
import { formatPulseDate, pulseUpdates } from '@/lib/pulse';

export const metadata: Metadata = {
  title: 'WebMCP learning center',
  description:
    'Practical WebMCP explainers, implementation guides, security reviews, eval methods, and frequently asked questions.',
  alternates: { canonical: '/learn' },
  openGraph: {
    title: 'WebMCP learning center · isWebMCP',
    description:
      'Practical explainers, implementation guides, security reviews, and eval methods.',
    type: 'website',
    url: '/learn',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP learning center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebMCP learning center · isWebMCP',
    description:
      'Practical explainers, implementation guides, security reviews, and eval methods.',
    images: ['/og.png'],
  },
};

export default function LearnPage() {
  const featured = learningArticles.filter((article) => article.featured);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-18">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <span className="status-chip">
                <BookOpen className="size-3" aria-hidden="true" />{' '}
                {learningArticles.length} in-depth resources
              </span>
              <p className="eyebrow mt-8 text-signal-ink">
                WebMCP field manual
              </p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
                From first principles to production evidence.
              </h1>
            </div>
            <div>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Original, source-linked guidance for deciding where WebMCP fits,
                designing narrow contracts, sharing state safely, and proving
                that the result works.
              </p>
              <p className="mt-4 font-mono text-xs leading-5 text-muted-foreground">
                Status-sensitive claims reviewed{' '}
                {formatContentDate('2026-08-31')}. WebMCP remains an
                experimental Community Group draft.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 lg:px-8">
        <section aria-labelledby="start-here-heading">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Start here</p>
              <h2
                id="start-here-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Three foundations
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-3">
            {featured.map((article, index) => (
              <article key={article.slug} className="bg-card p-6">
                <span className="font-mono text-xs text-signal-ink">
                  0{index + 1}
                </span>
                <h3 className="mt-8 text-xl font-semibold">{article.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {article.dek}
                </p>
                <Link
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                  href={`/learn/${article.slug}`}
                >
                  Read {article.minutes}-minute guide{' '}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <ContentExplorer
          items={learningArticles.map(
            ({ slug, title, dek, kind, minutes, tags }) => ({
              slug,
              title,
              dek,
              kind,
              minutes,
              tags,
            }),
          )}
        />

        <section
          className="grid gap-5 lg:grid-cols-2"
          aria-label="More WebMCP resources"
        >
          <article className="rounded-xl bg-ink p-7 text-paper">
            <CircleHelp className="size-6 text-signal" aria-hidden="true" />
            <p className="eyebrow mt-8 text-signal">Questions, answered</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">
              {frequentlyAskedQuestions.length} direct answers without the
              hand-waving.
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-paper/60">
              Browser support, schemas, security, evidence, challenge tracking,
              and the difference between MCP and WebMCP.
            </p>
            <Button
              nativeButton={false}
              className="mt-7 bg-signal text-ink hover:bg-signal/85"
              render={<Link href="/faq" />}
            >
              Browse all FAQs <ArrowRight data-icon="inline-end" />
            </Button>
          </article>
          <article className="instrument-card p-7">
            <RadioTower className="size-6 text-signal-ink" aria-hidden="true" />
            <p className="eyebrow mt-8">Latest signal</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {pulseUpdates[0]?.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {pulseUpdates[0]?.summary}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
              <span>{pulseUpdates[0]?.sourceName}</span>
              <time dateTime={pulseUpdates[0]?.publishedAt}>
                {pulseUpdates[0]
                  ? formatPulseDate(pulseUpdates[0].publishedAt)
                  : ''}
              </time>
            </div>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
              href="/pulse"
            >
              Open the live pulse{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
