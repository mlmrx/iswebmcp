import { researchPackMarkdown } from '@/lib/enterprise/research';

export const dynamic = 'force-static';
export function GET() {
  return new Response(researchPackMarkdown(), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition':
        'attachment; filename="iswebmcp-enterprise-research-2026-09-05.md"',
      'x-content-type-options': 'nosniff',
    },
  });
}
