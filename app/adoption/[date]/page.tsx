import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdoptionReportView } from '@/components/adoption-report';
import { adoptionReports, getAdoptionReport } from '@/lib/adoption';
import { siteOrigin } from '@/lib/site-origin';

export function generateStaticParams() {
  return adoptionReports.map((report) => ({ date: report.date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const report = getAdoptionReport(date);
  if (!report) return {};
  return {
    title: report.title,
    description: report.dek,
    alternates: {
      canonical: `/adoption/${report.date}`,
      types: {
        'application/json': `/adoption/${report.date}/report.json`,
      },
    },
    openGraph: {
      title: `${report.title} · isWebMCP`,
      description: report.dek,
      type: 'article',
      url: `/adoption/${report.date}`,
      publishedTime: report.generatedAt,
    },
  };
}

export default async function DatedAdoptionPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const report = getAdoptionReport(date);
  if (!report) notFound();

  const reportJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    name: report.title,
    description: report.dek,
    datePublished: report.date,
    dateModified: report.generatedAt,
    url: `${siteOrigin}/adoption/${report.date}`,
    author: {
      '@type': 'Organization',
      name: 'isWebMCP',
      url: siteOrigin,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reportJsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <AdoptionReportView report={report} />
    </>
  );
}
