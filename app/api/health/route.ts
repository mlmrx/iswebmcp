export function GET() {
  return Response.json({
    status: 'ok',
    service: 'iswebmcp',
    specRevision: '2026-08-26-draft',
  });
}
