import pulseData from '@/content/pulse.json';

export type PulseTopic = 'webmcp' | 'mcp' | 'challenge';
export type GalleryStatus = 'not_published' | 'published' | 'unavailable';

export interface PulseUpdate {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  observedAt: string;
  sourceName: string;
  sourceUrl: string;
  topic: PulseTopic;
  status: 'draft' | 'published';
  tags: string[];
}

export interface ChallengeObservation {
  observedAt: string;
  participantCount: number | null;
  submissionCount: number | null;
  galleryStatus: GalleryStatus;
}

export interface ChallengeSnapshot {
  name: string;
  organizer: string;
  deadline: string;
  participantCount: number | null;
  participantCountObservedAt: string;
  participantCountNote: string;
  galleryStatus: GalleryStatus;
  submissionCount: number | null;
  galleryNote: string;
  participantSourceUrl: string;
  gallerySourceUrl: string;
  observations: ChallengeObservation[];
}

const data = pulseData as {
  generatedAt: string;
  policy: string;
  challenge: ChallengeSnapshot;
  updates: PulseUpdate[];
};

export const pulseGeneratedAt = data.generatedAt;
export const pulsePolicy = data.policy;
export const challengeSnapshot = data.challenge;
export const pulseUpdates = [...data.updates].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export function listPulseUpdates(
  options: {
    topic?: PulseTopic;
    limit?: number;
  } = {},
): PulseUpdate[] {
  const limit = Math.min(Math.max(options.limit ?? pulseUpdates.length, 1), 20);
  return pulseUpdates
    .filter((item) => !options.topic || item.topic === options.topic)
    .slice(0, limit);
}

export function formatPulseDate(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  }).format(date);
}
