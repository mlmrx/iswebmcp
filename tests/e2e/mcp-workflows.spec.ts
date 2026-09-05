import { expect, test } from '@playwright/test';

test('developer workflow leads to accessible, bounded implementation recipes', async ({
  page,
}) => {
  await page.goto('/developers');
  await page
    .getByRole('link', { name: 'Explore implementation recipes' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Turn a finding into a first fix.',
  );
  await page.getByText('View code: webmcp-search.mjs', { exact: true }).click();
  await expect(page.locator('pre').first()).toContainText('registerSearchTool');
  await expect(page.getByText('Limits', { exact: true })).toHaveCount(2);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
  await page
    .getByRole('link', { name: 'Run a before-and-after source comparison' })
    .click();
  await expect(page).toHaveURL(/\/developers#quickstart$/);
});

test('data-only recipe and comparison errors work over production HTTP transport', async ({
  request,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'One protocol run is sufficient.',
  );
  const headers = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
    'mcp-protocol-version': '2025-06-18',
  };
  const response = await request.post('/mcp', {
    headers,
    data: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_implementation_recipe',
        arguments: { recipe: 'search-tool' },
      },
    },
  });
  expect(response.status()).toBe(200);
  const result = (await response.json()).result;
  expect(result.isError).not.toBe(true);
  expect(result.structuredContent.status).toBe('review-required');
  expect(result.structuredContent.files[0].code).toContain(
    'context.registerTool',
  );
  const invalid = await request.post('/mcp', {
    headers,
    data: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'compare_source_reports',
        arguments: { baselineJson: '{}', currentJson: '{}' },
      },
    },
  });
  expect((await invalid.json()).result.isError).toBe(true);
});
