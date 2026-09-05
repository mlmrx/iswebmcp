import { pilotWorksheet } from '@/lib/enterprise/research';

export const dynamic = 'force-static';
export function GET() {
  return new Response(pilotWorksheet, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition':
        'attachment; filename="iswebmcp-enterprise-pilot-worksheet.md"',
      'x-content-type-options': 'nosniff',
    },
  });
}
