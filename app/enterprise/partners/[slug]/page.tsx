import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  EnterpriseFrame,
  ResearchNotice,
  ContextEvidence,
  BulletSection,
  PilotSections,
  SourceLedger,
  PartnerFit,
} from '@/components/enterprise-research';
import { partnerProspects } from '@/lib/enterprise/partners';

export function generateStaticParams() {
  return partnerProspects.map((partner) => ({ slug: partner.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const partner = partnerProspects.find((item) => item.slug === slug);
  if (!partner) return {};
  const title = `${partner.company}: proposed integration pilot`;
  const description = `Researched prospect—not a partner or endorsement. ${partner.summary}`;
  return {
    title,
    description,
    alternates: { canonical: `/enterprise/partners/${slug}` },
    openGraph: { title, description, url: `/enterprise/partners/${slug}` },
  };
}
export default async function PartnerProspectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = partnerProspects.find((item) => item.slug === slug);
  if (!partner) notFound();
  return (
    <EnterpriseFrame
      eyebrow={`${partner.company} · ${partner.product} · Uncontacted prospect`}
      title={partner.title}
      description={partner.summary}
    >
      <ResearchNotice partner />
      <ContextEvidence context={partner.context} sources={partner.sources} />
      <PartnerFit partner={partner} />
      <BulletSection
        title="Proposed integration—not a validated connector"
        items={partner.integration}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <BulletSection
          title="What we can supply now"
          items={partner.availableNow}
        />
        <BulletSection
          title="What needs development or partner agreement"
          items={partner.requiresWork}
        />
      </div>
      <PilotSections pilot={partner.pilot} />
      <BulletSection
        title="Risks and open diligence questions"
        items={partner.risks}
      />
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">
          Public route for a future conversation
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {partner.contact.qualification} No message or application has been
          sent for this proposal.
        </p>
        <a
          href={partner.contact.url}
          className="mt-4 inline-block font-semibold text-signal-ink hover:underline"
        >
          {partner.contact.label} ↗
        </a>
      </section>
      <SourceLedger sources={partner.sources} reviewedAt={partner.reviewedAt} />
    </EnterpriseFrame>
  );
}
