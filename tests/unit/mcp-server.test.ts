import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AUDIT_WIDGET_URI } from '@/lib/mcp/audit-widget';
import { createIsWebMcpServer } from '@/lib/mcp/server';
import { analyzeSource } from '@/lib/scanner';
import { summarizeReport } from '@/lib/integrations/report-summary';
import { sourceComparisonContext } from '@/lib/integrations/comparison-context';

function sourceSummary(
  html = '<main><h1>Search</h1><label for="q">Search</label><input id="q"></main>',
) {
  const url = 'https://example.com/';
  return summarizeReport({
    ...analyzeSource({
      normalizedUrl: url,
      finalUrl: url,
      html,
      status: 200,
      contentType: 'text/html',
      bytesRead: html.length,
      redirects: 0,
    }),
    comparisonContext: sourceComparisonContext({
      requestedUrl: url,
      finalUrl: url,
      analysisLimitBytes: 1_000_000,
    }),
  });
}

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
      'get_adoption_report',
      'list_adoption_implementers',
      'explain_evidence_level',
      'get_implementation_recipe',
      'compare_source_reports',
    ]);
    const audit = tools.find((tool) => tool.name === 'audit_public_url');
    expect(audit?.annotations?.readOnlyHint).toBe(false);
    expect(audit?.annotations?.openWorldHint).toBe(true);
    expect(audit?.annotations?.destructiveHint).toBe(false);
    expect(
      (audit?._meta?.ui as { resourceUri?: string } | undefined)?.resourceUri,
    ).toBe(AUDIT_WIDGET_URI);
    for (const tool of tools.slice(3)) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      });
      expect(tool.outputSchema).toBeDefined();
      expect(tool._meta?.ui).toBeUndefined();
    }
  });

  it('returns adoption intelligence with evidence boundaries intact', async () => {
    const report = await client.callTool({
      name: 'get_adoption_report',
      arguments: {},
    });
    expect(report.isError).not.toBe(true);
    expect(report.structuredContent).toMatchObject({
      date: '2026-09-10',
      summary: {
        providerEngineeredDeployments: 9,
        platformInheritedDeployments: 72,
      },
    });

    const implementers = await client.callTool({
      name: 'list_adoption_implementers',
      arguments: { query: 'render.docs.search', surfaceStatus: 'legacy' },
    });
    expect(implementers.isError).not.toBe(true);
    expect(implementers.structuredContent).toMatchObject({
      count: 1,
      results: [
        {
          organization: 'Render',
          evidenceLevel: 'source-confirmed',
          surfaceStatus: 'legacy',
        },
      ],
    });
  });

  it.each(['search-tool', 'accessible-controls'])(
    'returns the %s recipe without applying it',
    async (recipe) => {
      const result = await client.callTool({
        name: 'get_implementation_recipe',
        arguments: { recipe },
      });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        id: recipe,
        status: 'review-required',
        evidenceScope: 'implementation-guidance',
      });
    },
  );

  it('compares real scanner summaries through the MCP schema', async () => {
    const baseline = sourceSummary();
    const current = sourceSummary('<main><h1>Search</h1><input id="q"></main>');
    const result = await client.callTool({
      name: 'compare_source_reports',
      arguments: {
        baselineJson: JSON.stringify(baseline),
        currentJson: JSON.stringify(current),
      },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      regressed: true,
      evidenceScope: 'source-only',
      inputProvenance: 'user-supplied-not-independently-authenticated',
    });
    const unchanged = await client.callTool({
      name: 'compare_source_reports',
      arguments: {
        baselineJson: JSON.stringify(baseline),
        currentJson: JSON.stringify(baseline),
      },
    });
    expect(unchanged.isError).not.toBe(true);
    expect(unchanged.structuredContent).toMatchObject({ regressed: false });
  });

  it.each([
    'model',
    'url',
    'context',
    'partial',
    'imported',
    'synthetic',
    'chronology',
    'inventory',
    'oversize',
    'json',
  ])('rejects %s evidence instead of passing it', async (kind) => {
    const baseline = sourceSummary();
    const current = structuredClone(baseline);
    if (kind === 'model') current.actionability.modelVersion = 'different';
    if (kind === 'url') current.url = 'https://other.example/';
    if (kind === 'context') current.comparisonContext = null;
    if (kind === 'partial') current.collection.truncated = true;
    if (kind === 'imported')
      current.labels.contract = 'imported-not-independently-verified';
    if (kind === 'synthetic') current.reportKind = 'synthetic_fixture';
    if (kind === 'chronology') current.scannedAt = '2000-01-01T00:00:00.000Z';
    if (kind === 'inventory') current.findingsCoverage.total += 1;
    if (kind === 'oversize')
      current.findings = Array(101).fill(current.findings[0]);
    const result = await client.callTool({
      name: 'compare_source_reports',
      arguments: {
        baselineJson: JSON.stringify(baseline),
        currentJson: kind === 'json' ? '{broken}' : JSON.stringify(current),
      },
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toBeUndefined();
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
      summarySchemaVersion: 'iswebmcp-summary/v2',
      comparisonContext: null,
      findingsCoverage: { status: 'complete' },
      evidenceScope: 'synthetic-fixture',
      collection: { status: 'complete', truncated: false },
      labels: { runtime: 'unknown', lift: 'withheld' },
    });
    const summary = result.structuredContent as {
      findings: Array<{ ruleId: string }>;
      findingsCoverage: { total: number; returned: number };
    };
    expect(summary.findingsCoverage.total).toBe(summary.findings.length);
    expect(summary.findingsCoverage.returned).toBe(summary.findings.length);
    expect(summary.findings.every((finding) => Boolean(finding.ruleId))).toBe(
      true,
    );
  });
});
