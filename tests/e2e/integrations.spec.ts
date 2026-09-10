import { expect, test } from '@playwright/test';

const mcpHeaders = {
  accept: 'application/json, text/event-stream',
  'content-type': 'application/json',
};

test('integration gallery exposes five honest, downloadable surfaces', async ({
  page,
  request,
}, testInfo) => {
  await page.goto('/integrations');
  await expect(
    page.getByRole('heading', {
      name: 'One evidence model. Every agent surface.',
    }),
  ).toBeVisible();

  for (const name of [
    'VS Code extension',
    'ChatGPT plugin',
    'Claude plugin',
    'Cursor plugin',
    'Chrome extension',
  ]) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }
  await expect(page.getByText('https://iswebmcp.com/mcp')).toBeVisible();
  await expect(page.getByText('The unknowns stay visible')).toBeVisible();
  await page.getByRole('link', { name: /SDK, CLI, and CI adapter/ }).click();
  await expect(page).toHaveURL(/\/developers$/);
  await expect(
    page.getByRole('heading', { name: 'Find a problem. Fix it. Check again.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Install from npm' }),
  ).toHaveAttribute(
    'href',
    'https://www.npmjs.com/package/@iswebmcp/developer-kit',
  );
  await expect(page.getByText('npm install --save-dev')).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Download CI adapter/ }),
  ).toHaveAttribute(
    'href',
    '/developer-tools/iswebmcp-developer-tools-0.2.0.zip',
  );
  const developerManifest = await request.get(
    '/developer-tools/checksums.json',
  );
  expect(developerManifest.ok()).toBe(true);
  const developerArtifact = await developerManifest.json();
  const developerDownload = await request.get(
    `/developer-tools/${developerArtifact.filename}`,
  );
  expect(developerDownload.ok()).toBe(true);
  expect((await developerDownload.body()).byteLength).toBe(
    developerArtifact.bytes,
  );
  await page.screenshot({
    path: testInfo.outputPath('developer-page.png'),
    fullPage: true,
  });

  const checksumsResponse = await request.get('/downloads/checksums.json');
  expect(checksumsResponse.ok()).toBe(true);
  const checksums = (await checksumsResponse.json()) as {
    artifacts: Array<{ filename: string; bytes: number; sha256: string }>;
  };
  expect(checksums.artifacts).toHaveLength(5);
  for (const artifact of checksums.artifacts) {
    expect(artifact.bytes).toBeGreaterThan(1_000);
    expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    const response = await request.get(`/downloads/${artifact.filename}`);
    expect(response.ok()).toBe(true);
    expect((await response.body()).byteLength).toBe(artifact.bytes);
  }
});

test('remote MCP completes initialize, discovery, resource, and tool calls', async ({
  request,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'One protocol run is sufficient.',
  );

  const initialize = await request.post('/mcp', {
    headers: mcpHeaders,
    data: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'iswebmcp-e2e', version: '1.0.0' },
      },
    },
  });
  expect(initialize.status()).toBe(200);
  expect((await initialize.json()).result.serverInfo.name).toBe('isWebMCP');

  const protocolHeaders = {
    ...mcpHeaders,
    'mcp-protocol-version': '2025-06-18',
  };
  const toolsResponse = await request.post('/mcp', {
    headers: protocolHeaders,
    data: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  });
  const tools = (await toolsResponse.json()).result.tools as Array<{
    name: string;
    annotations?: { readOnlyHint?: boolean; openWorldHint?: boolean };
    _meta?: { ui?: { resourceUri?: string } };
  }>;
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
  expect(tools[0]?.annotations).toMatchObject({
    readOnlyHint: false,
    openWorldHint: true,
    destructiveHint: false,
  });
  expect(tools[0]?._meta?.ui?.resourceUri).toBe('ui://iswebmcp/audit-v1.html');

  const sampleResponse = await request.post('/mcp', {
    headers: protocolHeaders,
    data: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'show_sample_audit', arguments: {} },
    },
  });
  const sample = (await sampleResponse.json()).result;
  expect(sample.isError).not.toBe(true);
  expect(sample.structuredContent).toMatchObject({
    reportKind: 'synthetic_fixture',
    evidenceScope: 'synthetic-fixture',
    labels: { runtime: 'unknown', lift: 'withheld' },
  });

  const resourceResponse = await request.post('/mcp', {
    headers: protocolHeaders,
    data: {
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/read',
      params: { uri: 'ui://iswebmcp/audit-v1.html' },
    },
  });
  const resource = (await resourceResponse.json()).result.contents[0];
  expect(resource.mimeType).toBe('text/html;profile=mcp-app');
  expect(resource.text).toContain('Public action-surface audit');
});

test('native scan endpoint rejects private targets as target errors', async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One API run is sufficient.');
  const response = await request.post('/api/integrations/scan', {
    data: { url: 'http://127.0.0.1:4173' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    error: { code: 'UNSAFE_TARGET' },
  });
});
