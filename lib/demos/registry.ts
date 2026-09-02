import { contractDemos } from '@/lib/demos/contract';
import { reliabilityDemos } from '@/lib/demos/reliability';
import { securityDemos } from '@/lib/demos/security';
import type { DemoCategory, DemoScenario } from '@/lib/demos/types';
import { valueDemos } from '@/lib/demos/value';

export const demoCategoryDetails: Record<
  DemoCategory,
  { label: string; description: string }
> = {
  value: {
    label: 'Value',
    description: 'Where explicit actions remove interface guesswork.',
  },
  contract: {
    label: 'Contract design',
    description:
      'How names, schemas, state, and lifecycle make tools dependable.',
  },
  security: {
    label: 'Security',
    description:
      'How authority, data, and consequence boundaries stay visible.',
  },
  reliability: {
    label: 'Reliability',
    description: 'How tools fail, recover, abstain, and degrade gracefully.',
  },
};

export const demoScenarios: readonly DemoScenario[] = [
  ...valueDemos,
  ...contractDemos,
  ...securityDemos,
  ...reliabilityDemos,
];

export function getDemoScenario(slug: string): DemoScenario | undefined {
  return demoScenarios.find((scenario) => scenario.slug === slug);
}
