import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createIsWebMcpServer } from '@/lib/mcp/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_MCP_BODY_BYTES = 256_000;

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers':
    'content-type, mcp-session-id, last-event-id, mcp-protocol-version',
  'access-control-expose-headers': 'mcp-session-id, mcp-protocol-version',
  'access-control-max-age': '3600',
  'x-content-type-options': 'nosniff',
};

function requesterKey(request: Request): string {
  const forwarded =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('cf-connecting-ip') ??
    'local-or-anonymous';
  return (forwarded.split(',', 1)[0] ?? 'local-or-anonymous')
    .trim()
    .slice(0, 64);
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) {
    headers.set(name, value);
  }
  headers.set('cache-control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function boundedBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_MCP_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_MCP_BODY_BYTES) {
    throw new Error('BODY_TOO_LARGE');
  }
  return JSON.parse(text) as unknown;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function handle(request: Request) {
  try {
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = createIsWebMcpServer(requesterKey(request));
    await server.connect(transport);
    const parsedBody =
      request.method === 'POST' ? await boundedBody(request) : undefined;
    return withCors(await transport.handleRequest(request, { parsedBody }));
  } catch (error) {
    const tooLarge =
      error instanceof Error && error.message === 'BODY_TOO_LARGE';
    const invalidJson = error instanceof SyntaxError;
    return Response.json(
      {
        jsonrpc: '2.0',
        error: {
          code: tooLarge ? -32_001 : -32_700,
          message: tooLarge
            ? 'MCP request body exceeds 256 KB.'
            : invalidJson
              ? 'MCP request body must be valid JSON.'
              : 'The MCP request could not be processed.',
        },
        id: null,
      },
      {
        status: tooLarge ? 413 : 400,
        headers: { ...corsHeaders, 'cache-control': 'no-store' },
      },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
