import type { Metadata } from 'next';

import { WorkbenchView } from '@/components/workbench-view';

export const metadata: Metadata = {
  title: 'Tool Contract Workbench',
  description:
    'Deterministically audit WebMCP names, schemas, annotations, lifecycle cleanup, and security signals.',
  openGraph: {
    title: 'WebMCP Tool Contract Workbench · isWebMCP',
    description:
      'Audit tool names, schemas, annotations, lifecycle cleanup, and security signals.',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP tool contract workbench',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebMCP Tool Contract Workbench · isWebMCP',
    description:
      'Audit tool names, schemas, annotations, lifecycle cleanup, and security signals.',
    images: ['/og.png'],
  },
};

export default function WorkbenchPage() {
  return <WorkbenchView />;
}
