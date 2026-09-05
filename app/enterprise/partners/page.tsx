import type { Metadata } from 'next';
import {
  EnterpriseFrame,
  ResearchNotice,
  PartnerCard,
} from '@/components/enterprise-research';
import {
  rankedPartners,
  fitCriteria,
  screenedAlternatives,
} from '@/lib/enterprise/research';

export const metadata: Metadata = {
  title: 'Five design and integration partner prospects',
  description:
    'A bounded official-source partner shortlist, with proposed integrations, pilot constraints and an explicit editorial fit rubric. No partnerships implied.',
  alternates: { canonical: '/enterprise/partners' },
  openGraph: {
    title: 'isWebMCP partner prospect research',
    description: 'Five researched prospects, not existing partnerships.',
    url: '/enterprise/partners',
  },
};

export default function PartnerResearchPage() {
  return (
    <EnterpriseFrame
      eyebrow="Partner research · Reviewed September 5, 2026"
      title="Find a partner with a concrete integration path."
      description="Five researched design and integration prospects. Each has a specific proposed integration, a pilot offer, a documented public contact route, and clear dependencies before it can work."
    >
      <ResearchNotice partner />
      <p className="text-sm leading-7 text-muted-foreground">
        Prioritized for a mix of current release checks and future runtime
        research. Scores are editorial judgments, not validated integrations.{' '}
        <a
          href="#selection"
          className="font-semibold text-signal-ink underline underline-offset-4"
        >
          Read the selection method.
        </a>
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {rankedPartners.map((partner, index) => (
          <PartnerCard key={partner.slug} partner={partner} index={index} />
        ))}
      </div>
      <section
        id="selection"
        className="scroll-mt-24 rounded-2xl border border-border p-6"
      >
        <h2 className="text-2xl font-semibold">Selection method and limits</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          GoDaddy, Lovable and Cloudflare were requested starting points; two
          complementary candidates were selected after a broader screen. This is
          a constrained shortlist, not a claim to have found the five best
          partners in the entire market. The existing smaller-tool prospect
          pipeline remains a separate outreach track.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          The /10 score is our editorial judgment: five equally weighted
          criteria, each scored 0 (weak or unestablished), 1 (conditional), or 2
          (strong documented fit). It is not a company-quality rating, measured
          adoption, or validated integration. Ties favor current product fit,
          then reusable integration, then company name. Public integration
          documentation does not establish interest in partnering.
        </p>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {fitCriteria.map((criterion) => (
            <div key={criterion.key}>
              <dt className="text-sm font-semibold">{criterion.label}</dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                {criterion.explanation}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-2xl border border-border p-6">
        <h2 className="text-2xl font-semibold">Other candidates screened</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          These are credible alternatives, not rejected companies. GoDaddy is
          included as an agency-channel hypothesis; an exclusively near-term
          developer-integration strategy could prioritize Webflow or Checkly
          instead.
        </p>
        <ul className="mt-5 space-y-5">
          {screenedAlternatives.map((candidate) => (
            <li key={candidate.company} className="text-sm leading-7">
              <h3 className="font-semibold">{candidate.company}</h3>
              <p className="mt-1 text-muted-foreground">
                {candidate.rationale}
              </p>
              <a
                className="font-semibold text-signal-ink underline underline-offset-4"
                href={candidate.url}
              >
                {candidate.title} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </EnterpriseFrame>
  );
}
