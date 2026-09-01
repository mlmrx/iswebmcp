import type { Metadata } from 'next';
import { ArrowUpRight, CalendarClock, RadioTower, Users } from 'lucide-react';
import Link from 'next/link';

import {
  challengeSnapshot,
  formatPulseDate,
  pulseGeneratedAt,
  pulsePolicy,
  pulseUpdates,
} from '@/lib/pulse';

export const metadata: Metadata = {
  title: 'WebMCP pulse',
  description:
    'A source-linked feed of WebMCP and relevant MCP ecosystem changes, plus an honest WebMCP Challenge aggregate tracker.',
  alternates: { canonical: '/pulse' },
  openGraph: {
    title: 'WebMCP pulse · isWebMCP',
    description:
      'Source-linked WebMCP news, relevant MCP ecosystem changes, and challenge signals.',
    type: 'website',
    url: '/pulse',
    images: [
      { url: '/og.png', width: 1672, height: 941, alt: 'isWebMCP pulse' },
    ],
  },
};

const topicLabel = {
  webmcp: 'WebMCP',
  mcp: 'MCP ecosystem',
  challenge: 'Challenge',
} as const;

function formatObserved(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value));
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  }).format(new Date(value));
}

export default function PulsePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <span className="status-chip">
                <RadioTower className="size-3" aria-hidden="true" />{' '}
                Source-linked signal desk
              </span>
              <p className="eyebrow mt-8 text-signal-ink">WebMCP pulse</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
                What changed, what it means, where it came from.
              </h1>
            </div>
            <div>
              <p className="text-lg leading-8 text-muted-foreground">
                Primary-source updates for WebMCP, clearly separated from
                broader MCP protocol news and challenge activity.
              </p>
              <p className="mt-4 font-mono text-xs leading-5 text-muted-foreground">
                Feed checked {formatObserved(pulseGeneratedAt)} · {pulsePolicy}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-5 py-10 lg:px-8">
        <section
          id="challenge"
          className="scroll-mt-24"
          aria-labelledby="challenge-heading"
        >
          <div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
            <div className="rounded-xl bg-ink p-7 text-paper">
              <p className="eyebrow text-signal">Challenge pulse</p>
              <h2
                id="challenge-heading"
                className="mt-3 text-3xl font-semibold tracking-[-.04em]"
              >
                Registrations are not submissions.
              </h2>
              <p className="mt-4 text-sm leading-6 text-paper/60">
                Devpost exposes an aggregate participant counter publicly,
                requires login for identities, and has not published the project
                gallery. We do not bypass that boundary or infer a submission
                count.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold">
                <a
                  className="inline-flex items-center gap-1.5 underline decoration-paper/30 underline-offset-4"
                  href={challengeSnapshot.participantSourceUrl}
                >
                  Participants source <ArrowUpRight className="size-3" />
                </a>
                <a
                  className="inline-flex items-center gap-1.5 underline decoration-paper/30 underline-offset-4"
                  href={challengeSnapshot.gallerySourceUrl}
                >
                  Project gallery <ArrowUpRight className="size-3" />
                </a>
              </div>
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              <article className="bg-card p-6">
                <Users className="size-5 text-signal-ink" aria-hidden="true" />
                <p className="mt-8 text-4xl font-semibold tracking-[-.055em]">
                  {challengeSnapshot.participantCount?.toLocaleString() ?? '—'}
                </p>
                <h3 className="mt-2 text-sm font-semibold">
                  Participants observed
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Latest public counter, observed{' '}
                  {formatObserved(challengeSnapshot.participantCountObservedAt)}
                  .
                </p>
              </article>
              <article className="bg-card p-6">
                <RadioTower
                  className="size-5 text-warning"
                  aria-hidden="true"
                />
                <p className="mt-8 text-2xl font-semibold tracking-[-.04em]">
                  Not published
                </p>
                <h3 className="mt-2 text-sm font-semibold">
                  Submitted projects
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  The gallery is not live, so the correct value is unknown—not
                  zero.
                </p>
              </article>
              <article className="bg-card p-6">
                <CalendarClock
                  className="size-5 text-signal-ink"
                  aria-hidden="true"
                />
                <p className="mt-8 text-2xl font-semibold tracking-[-.04em]">
                  {formatDeadline(challengeSnapshot.deadline)}
                </p>
                <h3 className="mt-2 text-sm font-semibold">Pacific deadline</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Freeze the submitted repo, video, entry, and live app after
                  the cutoff.
                </p>
              </article>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-xs leading-5 text-muted-foreground md:grid-cols-2">
            <p className="rounded-xl border border-border bg-card p-4">
              <span className="font-semibold text-foreground">
                Counter quality.
              </span>{' '}
              {challengeSnapshot.participantCountNote}
            </p>
            <p className="rounded-xl border border-border bg-card p-4">
              <span className="font-semibold text-foreground">
                Gallery quality.
              </span>{' '}
              {challengeSnapshot.galleryNote}
            </p>
          </div>
        </section>

        <section aria-labelledby="updates-heading">
          <div className="grid gap-6 lg:grid-cols-[.5fr_1.5fr]">
            <div>
              <p className="eyebrow">Latest feed</p>
              <h2
                id="updates-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Verified changes, not hourly filler.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                The monitor can check approved official feeds hourly. A new card
                appears only when a primary source materially changes.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                href="/feed.xml"
              >
                Subscribe via RSS{' '}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-4">
              {pulseUpdates.map((item) => (
                <article
                  id={item.id}
                  key={item.id}
                  className="instrument-card scroll-mt-24 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="source-badge">
                      {topicLabel[item.topic]}
                    </span>
                    <time
                      className="font-mono text-[10px] text-muted-foreground"
                      dateTime={item.publishedAt}
                    >
                      {formatPulseDate(item.publishedAt)}
                    </time>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-.025em]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
                    <span className="text-muted-foreground">
                      {item.sourceName}
                    </span>
                    <a
                      className="inline-flex items-center gap-1.5 font-semibold"
                      href={item.sourceUrl}
                    >
                      Read primary source{' '}
                      <ArrowUpRight className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="instrument-card p-6"
          aria-labelledby="source-policy-heading"
        >
          <p className="eyebrow">Editorial controls</p>
          <h2
            id="source-policy-heading"
            className="mt-2 text-2xl font-semibold"
          >
            How the pulse stays useful
          </h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p>
              <span className="font-semibold text-foreground">
                Primary sources first.
              </span>{' '}
              Specs, official project posts, release feeds, and vendor
              implementation documentation are linked directly.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                Boundaries stay visible.
              </span>{' '}
              Normative WebMCP changes, vendor implementation news, MCP
              ecosystem releases, and challenge updates use separate labels.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                No automated Devpost scraping.
              </span>{' '}
              Challenge aggregates remain timestamped manual observations unless
              an authorized data path becomes available.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
