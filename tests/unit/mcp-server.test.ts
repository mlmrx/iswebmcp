import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AUDIT_WIDGET_URI } from '@/lib/mcp/audit-widget';
import { createIsWebMcpServer } from '@/lib/mcp/server';

describe('isWebMCP remote MCP server', () => {
  let client: Client;
  let server: ReturnType<typeof createIsWebMcpServer>;

  beforeEach(async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'iswebmcp-test', version: '1.0.0' });
    server = createIsWebMcpServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterEach(async () => {
    await Promise.all([client.close(), server.close()]);
  });

  it('advertises a small, accurately annotated tool surface', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      'audit_public_url',
      'show_sample_audit',
      'audit_tool_contracts',
      'explain_evidence_level',
    ]);
    const audit = tools.find((tool) => tool.name === 'audit_public_url');
    expect(audit?.annotations?.readOnlyHint).toBe(true);
    expect(audit?.annotations?.openWorldHint).toBe(true);
    expect(
      (audit?._meta?.ui as { resourceUri?: string } | undefined)?.resourceUri,
    ).toBe(AUDIT_WIDGET_URI);
  });

  it('returns the render-only audit widget as an MCP App resource', async () => {
    const { resources } = await client.listResources();
    expect(
      resources.some((resource) => resource.uri === AUDIT_WIDGET_URI),
    ).toBe(true);
    const result = await client.readResource({ uri: AUDIT_WIDGET_URI });
    expect(result.contents[0]?.mimeType).toBe('text/html;profile=mcp-app');
    expect(result.contents[0]).toHaveProperty('text');
  });

  it('renders a synthetic walkthrough without network access', async () => {
    const result = await client.callTool({
      name: 'show_sample_audit',
      arguments: {},
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      evidenceScope: 'synthetic-fixture',
      collection: { status: 'complete', truncated: false },
      labels: { runtime: 'unknown', lift: 'withheld' },
    });
  });
});
