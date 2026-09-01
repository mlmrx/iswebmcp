import { learningArticles, learningCatalogUpdatedAt } from '@/lib/content';
import { challengeSnapshot, pulseGeneratedAt, pulseUpdates } from '@/lib/pulse';

export function GET() {
  const generatedAt = new Date(
    Math.max(
      Date.parse(pulseGeneratedAt),
      Date.parse(`${learningCatalogUpdatedAt}T23:59:59Z`),
    ),
  ).toISOString();
  return Response.json(
    {
      generated_at: generatedAt,
      articles: learningArticles.map(
        ({ slug, title, dek, kind, minutes, tags, updatedAt }) => ({
          slug,
          url: `/learn/${slug}`,
          title,
          summary: dek,
          kind,
          reading_minutes: minutes,
          tags,
          updated_at: updatedAt,
        }),
      ),
      latest_updates: pulseUpdates,
      challenge: challengeSnapshot,
      provenance: {
        policy: 'Original summaries with direct primary-source links.',
        devpost:
          'Timestamped public aggregate observation; no identities or inferred submissions.',
      },
    },
    {
      headers: {
        'cache-control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
}
