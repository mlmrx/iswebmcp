export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  accessedAt: string;
}

export interface EnterpriseScenario {
  slug: string;
  company: string;
  product: string;
  title: string;
  summary: string;
  reviewedAt: string;
  status: 'illustrative-not-validated';
  context: Array<{ claim: string; sourceIds: string[] }>;
  workflow: string[];
  availableNow: string[];
  requiresWork: string[];
  pilot: {
    scope: string;
    deliverables: string[];
    successSignals: string[];
    stopConditions: string[];
  };
  risks: string[];
  sources: ResearchSource[];
}

export interface PartnerProspect {
  slug: string;
  company: string;
  product: string;
  title: string;
  summary: string;
  reviewedAt: string;
  status: 'prospect-not-contacted';
  context: Array<{ claim: string; sourceIds: string[] }>;
  integration: string[];
  availableNow: string[];
  requiresWork: string[];
  pilot: {
    scope: string;
    deliverables: string[];
    successSignals: string[];
    stopConditions: string[];
  };
  risks: string[];
  fit: {
    currentUtility: number;
    integrationPath: number;
    reusableDistribution: number;
    pilotTractability: number;
    runtimePotential: number;
    rationale: string;
  };
  contact: { label: string; url: string; qualification: string };
  sources: ResearchSource[];
}
