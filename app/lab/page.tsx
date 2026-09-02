import type { Metadata } from 'next';

import { LabView } from '@/components/lab-view';

export const metadata: Metadata = {
  title: 'Before/After Proof Lab',
  description:
    'Run the same synthetic journey through UI-only and WebMCP-enabled paths, then measure the difference.',
  alternates: { canonical: '/lab' },
  openGraph: {
    title: 'Before/After WebMCP Proof Lab · isWebMCP',
    description:
      'Run the same synthetic journey through UI-only and WebMCP-enabled paths, then measure the difference.',
    type: 'website',
    images: [
      { url: '/og.png', width: 1672, height: 941, alt: 'isWebMCP proof lab' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Before/After WebMCP Proof Lab · isWebMCP',
    description:
      'Compare user-run UI-only and WebMCP-enabled journeys with explicit evidence boundaries.',
    images: ['/og.png'],
  },
};

export default function LabPage() {
  return <LabView />;
}
