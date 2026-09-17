import type { Metadata } from 'next';

import { AdoptionReportView } from '@/components/adoption-report';
import { latestAdoptionReport } from '@/lib/adoption';
import {
  compareDirectoryWithCensus,
  webMcpDirectory,
  webMcpDirectoryHistory,
} from '@/lib/adoption-directory';
import { siteOrigin } from '@/lib/site-origin';

export const metadata: Metadata = {
  title: 'WebMCP adoption report',
  description:
    'Daily, source-linked analysis of who has implemented WebMCP, which tools they expose, how they implemented them, and how strong the evidence is.',
  alternates: {
    canonical: '/adoption',
    types: {
      'application/rss+xml': '/adoption/feed.xml',
      'application/json': '/adoption/data.json',
      'text/markdown': '/adoption/latest.md',
    },
  },
  openGraph: {
    title: 'Daily WebMCP Adoption Report · isWebMCP',
    description:
      'Who implemented WebMCP, how they did it, which tools they expose, and what the evidence actually proves.',
    type: 'article',
    url: '/adoption',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP adoption intelligence',
      },
    ],
  },
};

export default function AdoptionPage() {
  const ecosystemComparison = compareDirectoryWithCensus(
    webMcpDirectory,
    latestAdoptionReport.census?.detections ?? [],
  );
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'isWebMCP Daily Adoption Report',
    description: latestAdoptionReport.dek,
    datePublished: latestAdoptionReport.date,
    dateModified: latestAdoptionReport.generatedAt,
    version: latestAdoptionReport.date,
    url: `${siteOrigin}/adoption`,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${siteOrigin}/adoption/data.json`,
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'text/markdown',
        contentUrl: `${siteOrigin}/adoption/latest.md`,
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${siteOrigin}/adoption/ecosystem.json`,
      },
    ],
    creator: {
      '@type': 'Organization',
      name: 'isWebMCP',
      url: siteOrigin,
    },
    measurementTechnique:
      'Public source inspection with explicit evidence levels and third-party census attribution.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetJsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <AdoptionReportView
        report={latestAdoptionReport}
        ecosystem={{ ...webMcpDirectory, sites: [] }}
        ecosystemHistory={webMcpDirectoryHistory}
        ecosystemComparison={ecosystemComparison}
      />
    </>
  );
}
