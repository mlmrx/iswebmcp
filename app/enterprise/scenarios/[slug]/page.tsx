import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  EnterpriseFrame,
  ResearchNotice,
  ContextEvidence,
  BulletSection,
  PilotSections,
  SourceLedger,
} from '@/components/enterprise-research';
import { enterpriseScenarios } from '@/lib/enterprise/scenarios';

export function generateStaticParams() {
  return enterpriseScenarios.map((scenario) => ({ slug: scenario.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scenario = enterpriseScenarios.find((item) => item.slug === slug);
  if (!scenario) return {};
  const title = `${scenario.company}: proposed enterprise use case`;
  const description = `Illustrative proposal, not a customer result. ${scenario.summary}`;
  return {
    title,
    description,
    alternates: { canonical: `/enterprise/scenarios/${slug}` },
    openGraph: { title, description, url: `/enterprise/scenarios/${slug}` },
  };
}
export default async function EnterpriseScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scenario = enterpriseScenarios.find((item) => item.slug === slug);
  if (!scenario) notFound();
  return (
    <EnterpriseFrame
      eyebrow={`${scenario.company} · ${scenario.product} · Proposed scenario`}
      title={scenario.title}
      description={scenario.summary}
    >
      <ResearchNotice />
      <ContextEvidence context={scenario.context} sources={scenario.sources} />
      <BulletSection
        title="Our proposed workflow—not a deployed integration"
        items={scenario.workflow}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <BulletSection
          title="What isWebMCP can provide now"
          items={scenario.availableNow}
        />
        <BulletSection
          title="What needs development or agreement"
          items={scenario.requiresWork}
        />
      </div>
      <PilotSections pilot={scenario.pilot} />
      <BulletSection
        title="Risks, constraints and unanswered questions"
        items={scenario.risks}
      />
      <SourceLedger
        sources={scenario.sources}
        reviewedAt={scenario.reviewedAt}
      />
    </EnterpriseFrame>
  );
}
