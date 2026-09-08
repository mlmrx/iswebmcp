const OPENAI_APPS_CHALLENGE = '7DxgMg4lbBg8aVFIh1JcpuHPHIZ66ior33Kx-yWXQ9U';

export function GET() {
  return new Response(OPENAI_APPS_CHALLENGE, {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
