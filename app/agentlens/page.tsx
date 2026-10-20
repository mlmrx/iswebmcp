import type { Metadata } from 'next';

import { AgentLens } from '@/components/agentlens';

export const metadata: Metadata = {
  title: 'AgentLens — Public-source quests for agent-ready sites',
  description:
    'Give a public page a mission. Map candidate actions, inspect source evidence, and earn field badges with AgentLens by isWebMCP.',
  alternates: { canonical: '/agentlens' },
  openGraph: {
    title: 'AgentLens by isWebMCP',
    description:
      'Public-source evidence, mission briefs, field badges, and honest boundaries for agent-ready websites.',
    url: '/agentlens',
    type: 'website',
  },
};

export default function AgentLensPage() {
  return <AgentLens />;
}
