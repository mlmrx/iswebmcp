import { learningArticles, learningCatalogUpdatedAt } from '@/lib/content';
import { latestAdoptionReport } from '@/lib/adoption';
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
      latest_adoption_report: {
        ...latestAdoptionReport,
        url: `/adoption/${latestAdoptionReport.date}`,
        json_url: `/adoption/${latestAdoptionReport.date}/report.json`,
      },
      challenge: {
        ...challengeSnapshot,
        historical: true,
        projectParticipation: false,
      },
      provenance: {
        policy: 'Original summaries with direct primary-source links.',
        devpost:
          'Archived external-event observations, not current status. isWebMCP did not participate. No identities or inferred submissions.',
      },
    },
    {
      headers: {
        'cache-control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
}
