import type { Metadata } from 'next';
import Link from 'next/link';
import {
  EnterpriseFrame,
  BulletSection,
} from '@/components/enterprise-research';
import { pilotSteps, researchReviewedAt } from '@/lib/enterprise/research';

export const metadata: Metadata = {
  title: 'Enterprise pilots and research',
  description:
    'A separate source-evidence pilot track for enterprise teams. Five illustrative enterprise scenarios and five researched partner prospects, not customer claims.',
  alternates: { canonical: '/enterprise' },
  openGraph: {
    title: 'isWebMCP enterprise pilots',
    description:
      'Proposed workflows and researched prospects. No customer results or partnerships implied.',
    url: '/enterprise',
  },
};

export default function EnterprisePage() {
  return (
    <EnterpriseFrame
      eyebrow="Enterprise pilots · Separate from the core developer toolkit"
      title="Bring agent-readiness evidence into your release workflow."
      description="Start with one approved public page, one useful finding, and a reviewed change. This is a scoped engineering pilot—not a promise to make every enterprise application agent-ready."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href="/enterprise/scenarios"
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          Explore five enterprise scenarios
        </Link>
        <Link
          href="/enterprise/partners"
          className="rounded-xl border border-border px-5 py-3 font-semibold"
        >
          Compare five partner prospects
        </Link>
        <a
          href="/enterprise/pilot-worksheet"
          download
          className="rounded-xl border border-border px-5 py-3 font-semibold"
        >
          Download pilot worksheet
        </a>
      </div>
      <aside
        aria-label="Offering status"
        className="rounded-xl border border-border bg-muted/50 p-5 text-sm leading-7"
      >
        <p className="font-semibold">
          Proposed enterprise offering · Research reviewed {researchReviewedAt}
        </p>
        <p className="mt-2 text-muted-foreground">
          Named companies are researched opportunities, not customers, partners,
          or endorsers. No company trial or quantified result is reported here.
          WebMCP is experimental, and broader MCP integrations do not establish
          browser WebMCP support.
        </p>
      </aside>
      <div className="grid gap-6 lg:grid-cols-2">
        <BulletSection
          title="Useful today"
          items={[
            'Bounded checks of public, unauthenticated HTML. Findings come with source evidence and recommendations.',
            'Node SDK/CLI and a local GitHub Actions adapter. Save reports in your own artifact store and compare compatible source findings.',
            'Review supplied tool contracts and retrieve implementation guidance through the shared MCP server.',
            'Two starter recipes: a browser search-tool adapter and an accessible search form. Your developers review, integrate, and deploy.',
          ]}
        />
        <BulletSection
          title="Requires a separate development phase"
          items={[
            'Private or authenticated application execution inside the enterprise environment.',
            'A connected-browser runner that executes authorized tasks and verifies independent outcomes.',
            'Tenant isolation, SSO/RBAC, controlled report history, configurable hosted retention, and enterprise audit logs.',
            'Dedicated service limits, operational support and an agreed SLA. These are not included in the public utility.',
          ]}
        />
      </div>
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-3xl font-semibold tracking-tight">
          One workflow. A decision based on evidence.
        </h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-2">
          {pilotSteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-border p-5"
            >
              <p className="font-mono text-xs text-signal-ink">0{index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          Running the CLI inside your CI does not make the scan private: it
          sends approved inputs to our hosted scanner. Source comparisons can
          run locally. Hosted URL-attempt retention is 90 days, with deletion
          during subsequent writes, and is not controlled by your CI artifact
          policy. Do not send secrets or private paths.
        </p>
        <Link
          href="/privacy"
          className="mt-3 inline-block text-sm font-semibold text-signal-ink hover:underline"
        >
          Review data handling before a pilot →
        </Link>
      </section>
      <section className="rounded-2xl border border-border p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">
          What would make the pilot worth keeping?
        </h2>
        <p className="mt-4 max-w-4xl leading-8 text-muted-foreground">
          A reviewer confirms a useful finding, a developer can act on it,
          comparable evidence survives the change, and the team chooses to reuse
          the check. Measure setup effort, actionable findings, false alarms,
          inconclusive checks and repeat usage. Runtime success, cost savings
          and ROI remain unmeasured until a separate evaluation establishes
          them.
        </p>
        <div className="mt-6 flex flex-wrap gap-5">
          <a
            href="/enterprise/research-pack"
            download
            className="font-semibold text-signal-ink hover:underline"
          >
            Download all ten research briefs →
          </a>
          <Link
            href="/support"
            className="font-semibold text-signal-ink hover:underline"
          >
            Discuss a scoped pilot →
          </Link>
        </div>
      </section>
    </EnterpriseFrame>
  );
}
