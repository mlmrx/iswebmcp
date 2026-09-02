import type { Metadata } from 'next';
import {
  ArrowUpRight,
  Braces,
  FlaskConical,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'Evidence provenance, scoring formulas, limitations, security boundaries, and WebMCP draft assumptions.',
  alternates: { canonical: '/methodology' },
  openGraph: {
    title: 'WebMCP readiness methodology · isWebMCP',
    description:
      'Evidence provenance, scoring formulas, limitations, and security boundaries.',
    type: 'website',
    images: [
      { url: '/og.png', width: 1672, height: 941, alt: 'isWebMCP methodology' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebMCP readiness methodology · isWebMCP',
    description:
      'Evidence provenance, scoring formulas, limitations, and security boundaries.',
    images: ['/og.png'],
  },
};

const sources = [
  ['Source', 'Fetched public markup. JavaScript is not executed.'],
  ['Runtime', 'Observed registration or execution in a supported browser.'],
  [
    'Imported',
    'Developer-provided tool inventory; sanitized but not independently verified.',
  ],
  [
    'Measured',
    'Directly recorded task events, outcomes, timings, and state assertions.',
  ],
  [
    'Inferred',
    'A bounded conclusion from visible evidence, always labeled with confidence.',
  ],
];

const tools = [
  'scan_public_url',
  'get_scan_summary',
  'list_action_surface',
  'get_finding_details',
  'search_webmcp_library',
  'get_webmcp_resource',
  'list_mcp_updates',
  'get_challenge_pulse',
  'select_demo_mode',
  'start_demo_run',
  'search_demo_products',
  'compare_demo_products',
  'add_demo_product_to_cart',
  'finish_demo_run',
  'compare_demo_runs',
  'export_current_report',
];

export default function MethodologyPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-chip">
              <Scale className="size-3" /> Open methodology
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Spec snapshot · 26 Aug 2026
            </span>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="eyebrow text-signal-ink">
                Evidence before verdicts
              </p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
                Presence is not readiness.
              </h1>
            </div>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              A page can register tools that agents misunderstand, call
              incorrectly, or use unsafely. isWebMCP separates source hints,
              contract quality, runtime behavior, journey success, and measured
              improvement.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-10 lg:px-8">
        <section aria-labelledby="evidence-model">
          <div className="grid gap-6 lg:grid-cols-[.55fr_1.45fr]">
            <div>
              <p className="eyebrow">Provenance</p>
              <h2
                id="evidence-model"
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                Five evidence sources
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Every conclusion carries its origin and confidence. Missing
                evidence is shown as “Not observed,” never silently converted to
                failure.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {sources.map(([name, detail], index) => (
                <article
                  key={name}
                  className={`instrument-card p-5 ${index === sources.length - 1 ? 'sm:col-span-2' : ''}`}
                >
                  <span className="source-badge">{name}</span>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="rounded-xl bg-ink p-6 text-paper sm:p-8"
          aria-labelledby="scores-heading"
        >
          <div className="grid gap-8 lg:grid-cols-[.6fr_1.4fr]">
            <div>
              <p className="eyebrow text-signal">Scoring</p>
              <h2
                id="scores-heading"
                className="mt-3 text-3xl font-semibold tracking-[-.04em]"
              >
                Four questions. Four evidence boundaries.
              </h2>
              <p className="mt-4 leading-7 text-paper/60">
                No generic readiness composite hides an unknown runtime or
                substitutes hypothetical ROI for observed behavior.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [
                  '01',
                  'Source actionability',
                  '0–100',
                  'Named task actions, semantic structure, accessible names, form clarity, state feedback, entities, and transport. Repeated markup is not rewarded. Every contribution is inspectable; a truncated page makes the complete-page range 0–100.',
                ],
                [
                  '02',
                  'Contract lint',
                  '0–100',
                  'Available for sanitized imported definitions. It checks names, schema shape, over-parameterization, safety annotations, declared state, and recovery—but never calls imported evidence runtime quality.',
                ],
                [
                  '03',
                  'Runtime readiness',
                  'trial evidence',
                  'Requires observed discovery and selection, schema rejection, authorization and confirmation, task success, postcondition verification, UI synchronization, recovery/idempotency, and lifecycle cleanup. A critical safety failure blocks “ready.”',
                ],
                [
                  '04',
                  'WebMCP Lift',
                  '−100…+100',
                  'Only calculated for paired interactive runs of the same task and fixture. Success 40% · actions 20% · elapsed 15% · invalid attempts 10% · human intervention 10% · verification 5%. Authored replays receive no number.',
                ],
              ].map(([number, title, range, detail]) => (
                <article
                  key={number}
                  className="rounded-xl border border-paper/15 bg-paper/5 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-signal">
                      {number}
                    </span>
                    <span className="font-mono text-xs text-paper/50">
                      {range}
                    </span>
                  </div>
                  <h3 className="mt-8 font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-paper/55">
                    {detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <p className="mt-6 border-t border-paper/15 pt-5 text-xs leading-6 text-paper/55">
            Source Actionability v2.1 and Contract Lint are transparent
            diagnostic heuristics, not calibrated predictors of agent task
            success and not cross-site league-table scores. Runtime Readiness
            and Lift require observed trials.
          </p>
          <div className="mt-4 font-mono text-xs leading-6 text-paper/55">
            Lift = round(100 × (0.40·successΔ + 0.20·actionReduction +
            0.15·elapsedReduction + 0.10·invalidReduction +
            0.10·interventionReduction + 0.05·verificationΔ))
          </div>
          <p className="mt-4 text-xs leading-6 text-paper/55">
            Counting rule: one UI action is one committed semantic control
            operation; each registered-tool execution is one tool call. Run
            start is setup, while finish/verification is counted on both paths.
            Mixed UI/tool paths and unpaired fixtures are not comparable.
            Repeated trials and uncertainty are required before generalizing a
            single paired result.
          </p>
        </section>

        <section
          className="grid gap-5 lg:grid-cols-2"
          aria-labelledby="scanner-heading"
        >
          <article className="instrument-card p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-positive" />
              <p className="eyebrow">Security boundary</p>
            </div>
            <h2 id="scanner-heading" className="mt-4 text-2xl font-semibold">
              What Quick Scan does
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>
                — Normalizes a bare domain to HTTPS in the browser, then accepts
                only absolute HTTP(S) URLs without embedded credentials.
              </li>
              <li>
                — Rejects local, private, link-local, multicast, reserved,
                documentation, and metadata address ranges.
              </li>
              <li>
                — Verifies A and AAAA resolution before every bounded redirect
                and fails closed when resolution cannot be verified.
              </li>
              <li>
                — Uses a neutral scanner identity, short timeout, HTML/XHTML
                allowlist, per-caller/host rate limit, and no cookies or
                authorization headers.
              </li>
              <li>
                — Streams a bounded HTML prefix of at most 1 MB and labels the
                report partial when more bytes exist, so a large page does not
                become a false “unreachable” result.
              </li>
              <li>
                — Treats fetched text as untrusted data, strips executable
                content from displayed evidence, and keeps the bounded HTML
                analysis window only for the current request.
              </li>
            </ul>
          </article>
          <article className="instrument-card p-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-5 text-warning" />
              <p className="eyebrow">Honest limitations</p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold">
              What it cannot prove
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>
                — It does not execute target JavaScript or inspect another
                origin’s live <code>document.modelContext</code>.
              </li>
              <li>
                — It cannot see authenticated states, dynamically rendered
                controls, shadow DOM, or tools registered after load.
              </li>
              <li>
                — DNS is rechecked before fetch, but ordinary Worker fetch
                resolves the hostname independently and cannot pin the
                connection to the preflight address. A rebinding or
                split-horizon race therefore remains possible.
              </li>
              <li>
                — Deployments that require an SSRF-grade guarantee need a
                separate address-pinned egress proxy or equivalent network
                policy; this hosted MVP does not claim that guarantee.
              </li>
              <li>
                — Report storage, rate limits, and concurrency counters are
                ephemeral and isolate-local. Durable reports and globally
                coordinated limits require a production data store or
                edge-rate-limit service.
              </li>
              <li>
                — Static code checks cannot prove authorization, side effects,
                UI synchronization, confirmation behavior, or agent selection
                accuracy.
              </li>
              <li>
                — Model evals and manual supported-browser verification remain
                required for production evidence.
              </li>
            </ul>
          </article>
        </section>

        <section
          className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"
          aria-labelledby="draft-heading"
        >
          <div>
            <div className="flex items-center gap-2">
              <Braces className="size-5 text-signal-ink" />
              <p className="eyebrow">Experimental API</p>
            </div>
            <h2
              id="draft-heading"
              className="mt-4 text-3xl font-semibold tracking-[-.04em]"
            >
              Draft-aware, not draft-confident.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              The current Web Machine Learning Community Group report is dated
              August 26, 2026. It is not a W3C Standard. The normative
              declarative section remains unfinished, input-schema semantics are
              not browser-enforced, and browser support is experimental.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
              <a
                className="inline-flex items-center gap-1.5 underline decoration-border underline-offset-4"
                href="https://webmachinelearning.github.io/webmcp/"
              >
                Current draft <ArrowUpRight className="size-3" />
              </a>
              <a
                className="inline-flex items-center gap-1.5 underline decoration-border underline-offset-4"
                href="https://wpt.fyi/results/webmcp"
              >
                Web Platform Tests <ArrowUpRight className="size-3" />
              </a>
              <a
                className="inline-flex items-center gap-1.5 underline decoration-border underline-offset-4"
                href="https://developer.chrome.com/docs/ai/webmcp/secure-tools"
              >
                Security guidance <ArrowUpRight className="size-3" />
              </a>
            </div>
          </div>
          <div className="instrument-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">This site’s action surface</p>
                <h3 className="mt-2 text-xl font-semibold">
                  16 top-level tools
                </h3>
              </div>
              <span className="status-chip">AbortSignal cleanup</span>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {tools.map((tool, index) => (
                <div
                  key={tool}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <span className="font-mono text-[9px] text-signal-ink">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <code className="text-xs">{tool}</code>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Core tools remain available across the top-level page. The three
              structured catalog tools are registered only in WebMCP demo mode
              and unregistered through an AbortSignal when the mode changes.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
