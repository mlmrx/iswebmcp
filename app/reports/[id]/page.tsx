import type { Metadata } from 'next';

import { ReportView } from '@/components/report-view';

export const metadata: Metadata = {
  title: 'Evidence report',
  description:
    'Source evidence, action surface, limitations, and prioritized WebMCP recommendations.',
  robots: { index: false, follow: false, noarchive: true },
  openGraph: {
    title: 'WebMCP evidence report · isWebMCP',
    description:
      'Source evidence, action surface, limitations, and prioritized recommendations.',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP evidence report',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebMCP evidence report · isWebMCP',
    description:
      'Source evidence, action surface, limitations, and prioritized recommendations.',
    images: ['/og.png'],
  },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportView scanId={id} />;
}
