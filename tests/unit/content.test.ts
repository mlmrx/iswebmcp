import { describe, expect, it } from 'vitest';

import {
  frequentlyAskedQuestions,
  getLearningArticle,
  getRelatedArticles,
  learningArticles,
  searchLearningArticles,
} from '@/lib/content';
import {
  challengeSnapshot,
  formatPulseDate,
  listPulseUpdates,
  pulseUpdates,
} from '@/lib/pulse';

describe('editorial content', () => {
  it('ships a substantial, uniquely addressable, source-linked library', () => {
    expect(learningArticles.length).toBeGreaterThanOrEqual(10);
    expect(new Set(learningArticles.map((article) => article.slug)).size).toBe(
      learningArticles.length,
    );
    for (const article of learningArticles) {
      expect(article.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(article.sections.length).toBeGreaterThanOrEqual(5);
      expect(article.sources.length).toBeGreaterThan(0);
      expect(Date.parse(`${article.updatedAt}T12:00:00Z`)).not.toBeNaN();
      for (const source of article.sources) {
        expect(new URL(source.url).protocol).toBe('https:');
      }
    }
  });

  it('searches by format and all query terms with a bounded result count', () => {
    const security = searchLearningArticles({
      query: 'prompt injection',
      kind: 'security',
      limit: 2,
    });
    expect(security).toHaveLength(1);
    expect(security[0]?.slug).toBe('webmcp-security-privacy-review');
    expect(searchLearningArticles({ limit: 999 })).toHaveLength(
      learningArticles.length,
    );
  });

  it('looks up resources and chooses distinct related resources', () => {
    const article = getLearningArticle('first-imperative-webmcp-tool');
    expect(article?.kind).toBe('how-to');
    const related = getRelatedArticles(article!);
    expect(related).toHaveLength(3);
    expect(related.every((item) => item.slug !== article?.slug)).toBe(true);
  });

  it('publishes a broad FAQ without duplicate questions', () => {
    expect(frequentlyAskedQuestions).toHaveLength(30);
    expect(
      new Set(frequentlyAskedQuestions.map((item) => item.question)).size,
    ).toBe(frequentlyAskedQuestions.length);
    expect(
      frequentlyAskedQuestions.some((item) =>
        item.answer.includes('Participants are not the same as submissions'),
      ),
    ).toBe(false);
    expect(
      frequentlyAskedQuestions.find((item) => item.id === 'faq-026')?.answer,
    ).toMatch(/participant counter.*submitted projects/i);
  });
});

describe('pulse data', () => {
  it('keeps updates sorted, attributed, and topically distinct', () => {
    expect(pulseUpdates.length).toBeGreaterThanOrEqual(6);
    expect(pulseUpdates.map((item) => item.publishedAt)).toEqual(
      [...pulseUpdates]
        .map((item) => item.publishedAt)
        .sort((a, b) => b.localeCompare(a)),
    );
    for (const item of pulseUpdates) {
      expect(new URL(item.sourceUrl).protocol).toBe('https:');
      expect(['webmcp', 'mcp', 'challenge']).toContain(item.topic);
    }
    expect(listPulseUpdates({ topic: 'mcp', limit: 1 })).toHaveLength(1);
    expect(listPulseUpdates({ topic: 'mcp', limit: 1 })[0]?.topic).toBe('mcp');
  });

  it('never infers a submission count from the participant counter', () => {
    expect(challengeSnapshot.participantCount).toBeGreaterThan(0);
    expect(challengeSnapshot.galleryStatus).toBe('not_published');
    expect(challengeSnapshot.submissionCount).toBeNull();
    expect(challengeSnapshot.galleryNote).toMatch(/not the same/i);
  });

  it('formats date-only publication values without a timezone day shift', () => {
    expect(formatPulseDate('2026-08-30')).toBe('Aug 30, 2026');
  });
});
