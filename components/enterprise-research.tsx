import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  EnterpriseScenario,
  PartnerProspect,
  ResearchSource,
} from '@/lib/enterprise/types';
import {
  enterpriseDisclosure,
  partnerDisclosure,
  fitCriteria,
  fitTotal,
} from '@/lib/enterprise/research';

export function EnterpriseFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-5 py-10 lg:px-8"
    >
      <nav
        aria-label="Enterprise research"
        className="flex flex-wrap gap-x-6 gap-y-3 border-b border-border pb-5 text-sm font-semibold text-signal-ink"
      >
        <Link href="/enterprise">Enterprise pilots</Link>
        <Link href="/enterprise/scenarios">Enterprise scenarios</Link>
        <Link href="/enterprise/partners">Partner shortlist</Link>
        <a href="/enterprise/research-pack" download>
          Download research pack
        </a>
      </nav>
      <header className="py-10">
        <p className="eyebrow text-signal-ink">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          {description}
        </p>
      </header>
      <div className="space-y-8 pb-8">{children}</div>
    </main>
  );
}

export function ResearchNotice({ partner = false }: { partner?: boolean }) {
  return (
    <aside
      aria-label="Research status"
      className="rounded-xl border border-border bg-muted/50 p-5 text-sm leading-6"
    >
      <p className="font-semibold">
        {partner
          ? 'Prospect research · No partnership claimed'
          : 'Proposed scenario · Not a customer result'}
      </p>
      <p className="mt-2 text-muted-foreground">
        {partner ? partnerDisclosure : enterpriseDisclosure} WebMCP remains
        experimental.
      </p>
    </aside>
  );
}

export function BulletSection({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function ContextEvidence({
  context,
  sources,
}: {
  context: Array<{ claim: string; sourceIds: string[] }>;
  sources: ResearchSource[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="eyebrow text-signal-ink">Documented by the company</p>
      <h2 className="mt-3 text-2xl font-semibold">
        What the official sources establish
      </h2>
      <ul className="mt-5 space-y-5">
        {context.map((fact) => (
          <li key={fact.claim} className="text-sm leading-7">
            <p>{fact.claim}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {fact.sourceIds.map((id) => {
                const source = sources.find((item) => item.id === id);
                return source ? (
                  <a
                    key={id}
                    href={source.url}
                    className="font-semibold text-signal-ink underline underline-offset-4"
                  >
                    {source.title} ↗
                  </a>
                ) : null;
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SourceLedger({
  sources,
  reviewedAt,
}: {
  sources: ResearchSource[];
  reviewedAt: string;
}) {
  return (
    <section className="rounded-2xl border border-border p-6">
      <h2 className="text-xl font-semibold">Source and date ledger</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Research reviewed {reviewedAt}. Dates describe the source, not a company
        trial. An unavailable publication date is left unknown.
      </p>
      <ul className="mt-5 space-y-4">
        {sources.map((source) => (
          <li key={source.id} className="text-sm leading-6">
            <a
              href={source.url}
              className="font-semibold text-signal-ink underline underline-offset-4"
            >
              {source.title} ↗
            </a>
            <p className="mt-1 text-muted-foreground">
              Publication date: {source.publishedAt ?? 'not established'} ·
              Checked: {source.accessedAt}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PilotSections({
  pilot,
}: {
  pilot: EnterpriseScenario['pilot'];
}) {
  return (
    <section className="space-y-5">
      <div>
        <p className="eyebrow text-signal-ink">
          Proposed pilot · Not performed
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          A bounded way to test the hypothesis
        </h2>
        <p className="mt-4 max-w-4xl leading-7 text-muted-foreground">
          {pilot.scope}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <BulletSection
          title="Deliverables to produce"
          items={pilot.deliverables}
        />
        <BulletSection
          title="Measures to collect—not results"
          items={pilot.successSignals}
        />
        <BulletSection
          title="Stop or decline if…"
          items={pilot.stopConditions}
        />
      </div>
    </section>
  );
}

export function ScenarioCard({ scenario }: { scenario: EnterpriseScenario }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-semibold text-signal-ink">
        {scenario.company} · Proposed scenario
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        {scenario.title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {scenario.summary}
      </p>
      <Link
        href={`/enterprise/scenarios/${scenario.slug}`}
        className="mt-5 inline-block pt-2 font-semibold text-signal-ink hover:underline"
      >
        Read the {scenario.company} proposal →
      </Link>
    </article>
  );
}

export function PartnerCard({
  partner,
  index,
}: {
  partner: PartnerProspect;
  index: number;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-signal-ink">
          {index + 1}. {partner.company} · Prospect
        </p>
        <p className="rounded-full border border-border px-3 py-1 text-xs">
          Editorial fit {fitTotal(partner)}/10
        </p>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        {partner.title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {partner.summary}
      </p>
      <p className="mt-4 text-sm leading-7">{partner.fit.rationale}</p>
      <Link
        href={`/enterprise/partners/${partner.slug}`}
        className="mt-5 inline-block font-semibold text-signal-ink hover:underline"
      >
        Review the {partner.company} pilot →
      </Link>
    </article>
  );
}

export function PartnerFit({ partner }: { partner: PartnerProspect }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-2xl font-semibold">
        Why this prospect: {fitTotal(partner)}/10 editorial fit
      </h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {partner.fit.rationale} This is our prioritization judgment, not a
        company-quality score or evidence of adoption.
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fitCriteria.map((criterion) => (
          <div
            key={criterion.key}
            className="rounded-xl border border-border p-4"
          >
            <dt className="text-sm font-semibold">{criterion.label}</dt>
            <dd className="mt-2 text-2xl font-semibold">
              {partner.fit[criterion.key]}
              <span className="text-sm text-muted-foreground"> / 2</span>
            </dd>
          </div>
        ))}
      </dl>
      <Link
        href="/enterprise/partners#selection"
        className="mt-5 inline-block text-sm font-semibold text-signal-ink hover:underline"
      >
        Read the selection method →
      </Link>
    </section>
  );
}
