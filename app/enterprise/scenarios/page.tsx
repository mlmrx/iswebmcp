import type { Metadata } from 'next';
import {
  EnterpriseFrame,
  ResearchNotice,
  ScenarioCard,
} from '@/components/enterprise-research';
import { enterpriseScenarios } from '@/lib/enterprise/scenarios';

export const metadata: Metadata = {
  title: 'Five proposed enterprise use cases',
  description:
    'Official-source opportunity research for five enterprise platforms. Illustrative proposals, not customer case studies or measured results.',
  alternates: { canonical: '/enterprise/scenarios' },
  openGraph: {
    title: 'Five proposed enterprise use cases',
    description:
      'Research-backed proposals—not customers or measured outcomes.',
    url: '/enterprise/scenarios',
  },
};

export default function EnterpriseScenariosPage() {
  return (
    <EnterpriseFrame
      eyebrow="Opportunity case studies · Reviewed September 5, 2026"
      title="Five enterprise workflows worth testing."
      description="Each brief separates what the company documents from what we propose. Read the integration boundary, a small pilot, measures to collect, and reasons to stop—not just the brand name."
    >
      <ResearchNotice />
      <div className="grid gap-6 md:grid-cols-2">
        {enterpriseScenarios.map((scenario) => (
          <ScenarioCard key={scenario.slug} scenario={scenario} />
        ))}
      </div>
      <section className="rounded-xl border border-border p-6 text-sm leading-7 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">
          How to read this selection
        </h2>
        <p className="mt-3">
          Cisco, Akamai and Microsoft were requested reference enterprises. Two
          additional platforms were selected for concrete web application
          surfaces and documented extension paths. This is a five-company
          opportunity screen, not a size ranking or a claim that these companies
          have agent-readiness problems. We did not scan their applications. Any
          pilot requires a willing application owner and approved data handling.
        </p>
      </section>
    </EnterpriseFrame>
  );
}
