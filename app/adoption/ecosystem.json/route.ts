import { latestAdoptionReport } from '@/lib/adoption';
import {
  compareDirectoryWithCensus,
  webMcpDirectory,
  webMcpDirectoryHistory,
} from '@/lib/adoption-directory';

export function GET() {
  const comparison = compareDirectoryWithCensus(
    webMcpDirectory,
    latestAdoptionReport.census?.detections ?? [],
  );
  return Response.json(
    {
      schema: 'https://iswebmcp.com/adoption/ecosystem/schema/v1',
      ...webMcpDirectory,
      history: webMcpDirectoryHistory,
      independentCensusComparison: comparison,
      citationPolicy:
        'Attribute these records to the webmcp.com Directory API. Directory presence is third-party index evidence, not independent runtime verification by isWebMCP.',
    },
    {
      headers: {
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
}
