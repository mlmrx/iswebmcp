import type { Metadata } from 'next';

import { AgentLens } from '@/components/agentlens';

export const metadata: Metadata = {
  title: 'AgentLens — Watch agent traces on your site',
  description:
    'Replay an illustrative agent run or import a real OpenTelemetry trace to inspect tool calls, page activity, timing, and reported tokens with AgentLens by isWebMCP.',
  alternates: { canonical: '/agentlens' },
  openGraph: {
    title: 'AgentLens by isWebMCP',
    description:
      'Visualize agent traces and inspect public-source evidence, with private reasoning and unreported metrics kept out of view.',
    url: '/agentlens',
    type: 'website',
  },
};

export default function AgentLensPage() {
  return <AgentLens />;
}
