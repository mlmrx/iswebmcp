export const demoCategories = [
  'value',
  'contract',
  'security',
  'reliability',
] as const;

export type DemoCategory = (typeof demoCategories)[number];

export interface DemoStep {
  label: string;
  detail: string;
  state: string;
}

export interface DemoFlow {
  title: string;
  framing: string;
  steps: readonly DemoStep[];
}

export interface DemoToolContract {
  name: string;
  title: string;
  description: string;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint?: boolean;
  };
  inputSchema: Readonly<Record<string, unknown>>;
  exampleInput: Readonly<Record<string, unknown>>;
  exampleResult: Readonly<Record<string, unknown>>;
}

export interface DemoVerification {
  question: string;
  beforeState: string;
  afterState: string;
  checks: readonly string[];
}

export type ConfirmationLevel = 'none' | 'review' | 'required';

export interface DemoConfirmationBoundary {
  level: ConfirmationLevel;
  trigger: string;
  behavior: string;
  rationale: string;
}

export interface DemoScenario {
  slug: string;
  category: DemoCategory;
  title: string;
  eyebrow: string;
  summary: string;
  lesson: string;
  risk: string;
  before: DemoFlow;
  after: DemoFlow;
  tool: DemoToolContract;
  verification: DemoVerification;
  confirmation: DemoConfirmationBoundary;
  evidenceLabel: 'Illustrative synthetic pattern';
}
