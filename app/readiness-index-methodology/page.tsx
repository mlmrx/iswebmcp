import type { Metadata } from 'next';
import Link from 'next/link';

import snapshotData from '@/data/webmcp-index/snapshot.json';
import type { WebIndexSnapshot } from '@/lib/web-index';

const snapshot = snapshotData as WebIndexSnapshot;

export const metadata: Metadata = {
  title: 'Index methodology',
  description:
    'Source selection, crawl audit, frozen WRI v1 formula, known validity limits, and correction process for the WebMCP Readiness Index.',
  alternates: { canonical: '/readiness-index-methodology' },
};

const formula = [
  [
    '55%',
    'Workflow signal',
    'action candidates × 13 + forms × 10 + controls × 2, capped at 100.',
  ],
  [
    '35%',
    'Baseline friction',
    '100 minus the source-only baseline actionability score.',
  ],
  [
    '10%',
    'Implementation gap',
    '100 when no static source hint appeared; 35 when one did.',
  ],
];

export default function IndexMethodologyPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
          <p className="eyebrow text-signal-ink">
            WebMCP Readiness Index · {snapshot.version}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Methodology you can challenge
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            The index is designed to create testable hypotheses, not verdicts
            about companies. WRI v1 is now frozen and explicitly labeled
            uncalibrated: its raw records are preserved, its collection outage
            is quarantined, and its score limitations are published instead of
            silently rewriting history.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:px-8">
        <section className="instrument-card p-6">
          <p className="eyebrow">1 · Population</p>
          <h2 className="mt-2 text-2xl font-semibold">
            A reproducible popularity proxy
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The target population is the first 100,000 domains in Tranco list{' '}
            <a
              className="font-medium text-foreground underline underline-offset-4"
              href={snapshot.source.listUrl}
            >
              {snapshot.source.listId}
            </a>
            , dated {snapshot.source.listDate}. Tranco is a research-oriented
            aggregate ranking. We call this “popular domains,” not measured
            traffic, visitors, or market share.
          </p>
        </section>
        <section className="instrument-card p-6">
          <p className="eyebrow">2 · Collection</p>
          <h2 className="mt-2 text-2xl font-semibold">
            One bounded, public homepage
          </h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            <p>
              {snapshot.methodology.pageScope} HTTPS is attempted first; HTTP is
              a fallback. Redirects, response bytes, per-request time, and total
              time are capped.
            </p>
            <p>
              {snapshot.methodology.evidenceScope} Page contents are analyzed in
              memory and discarded; the index retains only derived counts,
              scores, fetch metadata, and coverage state.
            </p>
            <p>
              {snapshot.methodology.robotsPolicy} A dedicated contact-bearing
              user agent is used. A root exclusion, 401/403 response, or
              temporary server error is not scored.
            </p>
            <p>
              DNS and every redirect target are checked against private,
              reserved, local, and special-purpose address ranges before a
              request is made.
            </p>
          </div>
        </section>
        <section className="rounded-2xl border border-warning/30 bg-warning/8 p-6">
          <p className="eyebrow text-warning">3 · Post-crawl integrity audit</p>
          <h2 className="mt-2 text-2xl font-semibold">
            100,000 scheduled is not 100,000 valid observations
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The runner wrote {snapshot.attemptedCount.toLocaleString()} unique,
            contiguous rank/domain records. A post-run audit found two
            scanner-wide <code>UPSTREAM_FAILURE</code> windows—ranks
            45,557–56,180 and 76,005–100,000—covering{' '}
            {snapshot.collectionErrorCount.toLocaleString()} records. Their
            speed and uninterrupted zero-success batches show a collection
            failure, not domain-specific evidence.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [snapshot.scheduledCount, 'Scheduled ranks'],
              [snapshot.validAttemptCount, 'Valid collection outcomes'],
              [snapshot.collectionErrorCount, 'Quarantined collection errors'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-2xl font-semibold">
                  {Number(value).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Raw NDJSON remains immutable. The checked-in audit manifest can only
            remap rows inside those exact ranges when their original state and
            error code match. The public status is therefore{' '}
            <strong className="text-foreground">audited partial</strong>, never
            “full corpus.”
          </p>
        </section>
        <section className="instrument-card p-6">
          <p className="eyebrow">4 · Frozen WRI v1 opportunity formula</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Reproducible does not mean validated
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {formula.map(([weight, title, detail]) => (
              <div key={title} className="rounded-xl bg-muted/55 p-4">
                <p className="font-mono text-2xl font-semibold">{weight}</p>
                <p className="mt-2 font-medium">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {detail}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl border border-border bg-card p-4 font-mono text-xs leading-6">
            opportunity = round(0.55 × workflow + 0.35 × friction + 0.10 ×
            implementation gap)
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Bands: 70–100 high leverage; 45–69 strong candidate; 20–44
            foundation; 0–19 low interaction. The score says where a WebMCP
            investigation may be valuable. It does not evaluate business
            quality, security, accessibility conformance, or a production WebMCP
            implementation.
          </p>
          <div className="mt-5 rounded-xl border border-warning/25 bg-warning/8 p-4 text-sm leading-6 text-muted-foreground">
            <strong className="text-foreground">
              Known v1 validity limits:
            </strong>{' '}
            raw control volume can saturate workflow signal even with no named
            action; missing score dimensions were renormalized; absence of a
            static hint was treated as an implementation gap even though runtime
            tools may exist; and the model was not calibrated against an
            independently human-rated holdout corpus. Across the scored corpus,
            only 69 distinct integer opportunity scores exist. The audited UI
            now gives equal scores the same dense score rank and keeps Tranco
            popularity separate.
          </div>
        </section>
        <section className="instrument-card p-6">
          <p className="eyebrow">5 · What “after” means</p>
          <h2 className="mt-2 text-2xl font-semibold">
            No counterfactual theater
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            {snapshot.methodology.afterPolicy} A real after score requires a
            developer-provided or runtime-observed tool inventory plus paired
            journey runs with the same goal, state, fixtures, and assertions.
            Until that evidence exists, lift remains unknown.
          </p>
        </section>
        <section className="instrument-card p-6">
          <p className="eyebrow">6 · Access, corrections, and limitations</p>
          <h2 className="mt-2 text-2xl font-semibold">
            A homepage snapshot is not the whole product
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            <li>
              Client-rendered, authenticated, regional, and consent-gated
              actions may be absent.
            </li>
            <li>
              Source hints do not prove tools registered or executed at runtime.
            </li>
            <li>Redirected domains may converge on the same final homepage.</li>
            <li>
              Results change as sites, network paths, and the source list
              change.
            </li>
            <li>
              WRI v1 classified 3,964 responses above its 640 KB cap as
              unreachable. The current quick scanner instead analyzes a bounded
              prefix and labels it partial; the frozen v1 rows are not
              retroactively rescored.
            </li>
            <li>
              The coarse v1 robots bucket can include an explicit exclusion,
              access denial, or robots-fetch failure; it is not proof that a
              site owner deliberately blocked this research.
            </li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            The server-rendered review slice contains{' '}
            {snapshot.publishedRowCount.toLocaleString()} records for page
            performance and is not a representative sample. The explorer can
            load and verify the complete compressed{' '}
            {snapshot.attemptedCount.toLocaleString()}-record attempt log on
            demand.
          </p>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Site owners can request a correction, exclusion, or rescan by
            opening a private repository issue or emailing{' '}
            <a
              className="font-medium text-foreground underline underline-offset-4"
              href="mailto:research@iswebmcp.com"
            >
              research@iswebmcp.com
            </a>
            . Include the domain, snapshot list ID, and evidence.
          </p>
        </section>
        <div>
          <Link
            href="/readiness-index"
            className="text-sm font-medium underline decoration-border underline-offset-4"
          >
            ← Return to the index
          </Link>
        </div>
      </div>
    </main>
  );
}
