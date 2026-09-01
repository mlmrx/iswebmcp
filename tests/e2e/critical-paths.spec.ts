import { expect, test } from '@playwright/test';

type BrowserTool = {
  execute: (input: unknown, options: { signal: AbortSignal }) => unknown;
};

async function executeRegisteredTool(
  page: import('@playwright/test').Page,
  name: string,
  input: unknown,
) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tools = (
        window as unknown as { __webmcpTools: Map<string, BrowserTool> }
      ).__webmcpTools;
      const tool = tools.get(toolName);
      if (!tool) throw new Error(`Tool ${toolName} is not registered.`);
      return tool.execute(toolInput, { signal: new AbortController().signal });
    },
    { toolName: name, toolInput: input },
  );
}

test('landing communicates the product and opens a sample evidence report', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Is your web app truly WebMCP ready?' }),
  ).toBeVisible();
  await expect(page.getByLabel('Public URL')).toBeVisible();
  await page
    .getByRole('button', { name: 'Open sample evidence report' })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Three measurements. No blended score.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Not enough runtime evidence.')).toBeVisible();
});

test('private targets fail closed', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Public URL').fill('http://127.0.0.1/admin');
  await page.getByRole('button', { name: 'Test this app' }).click();
  await expect(
    page.getByText(/private, reserved, and special-purpose/i),
  ).toBeVisible();
});

test('controlled before/after replay produces observed WebMCP Lift', async ({
  page,
}) => {
  await page.goto('/lab');
  await page.getByRole('button', { name: 'Replay both paths' }).click();
  await expect(page.getByText('Meaningful improvement')).toBeVisible();
  await expect(
    page.getByText('controlled replay', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('Aurora Q45').first()).toBeVisible();
});

test('the interactive baseline enforces search, comparison, cart, and verification order', async ({
  page,
}) => {
  await page.goto('/lab');
  await page.getByRole('button', { name: 'Start baseline run' }).click();
  await expect(
    page.getByRole('button', { name: /Add to demo cart/ }).first(),
  ).toBeDisabled();
  await page.getByLabel('Max price').fill('300');
  await page.getByLabel('Min rating').selectOption('4.5');
  await page.getByLabel('Min battery').fill('30');
  await page.getByLabel('Noise canceling').click();
  await expect(page.getByLabel('Noise canceling')).toBeChecked();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByLabel('Select Aurora Q45 to compare').click();
  await page.getByLabel('Select Sonic Arc to compare').click();
  await page.getByRole('button', { name: 'Compare selected' }).click();
  await page
    .getByRole('article')
    .filter({ hasText: 'Aurora Q45' })
    .getByRole('button', { name: 'Add to demo cart' })
    .click();
  await page.getByRole('button', { name: 'Finish and verify' }).click();
  await expect(
    page.getByText('Run completed: every deterministic assertion passed.'),
  ).toBeVisible();
});

test('a manifest import creates a refreshable derived report with explicit provenance', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open sample evidence report' })
    .click();
  await page.getByRole('button', { name: 'Load example' }).click();
  const originalUrl = page.url();
  await page.getByRole('button', { name: 'Import and audit' }).click();
  await expect(page).not.toHaveURL(originalUrl);
  await expect(
    page.getByText('Imported · not independently verified'),
  ).toBeVisible();
  await expect(page.getByText(/imported evidence coverage/i)).toBeVisible();

  await page.reload();
  await expect(
    page.getByText('Imported · not independently verified'),
  ).toBeVisible();
  const firstDerivedUrl = page.url();

  await page.locator('#manifest-file').setInputFiles({
    name: 'tools.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify([
        {
          name: 'compare_products',
          description: 'Compare selected products using stable identifiers.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
        },
      ]),
    ),
  });
  await expect(page.getByText('Loaded tools.json.')).toBeVisible();
  await page.getByRole('button', { name: 'Import and audit' }).click();
  await expect(page).not.toHaveURL(firstDerivedUrl);
  await expect(page.getByText('1 imported contract attached')).toBeVisible();
});

test('registered WebMCP tools execute the complete journey and return structured contract errors', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const registry = new Map<string, BrowserTool>();
    Object.defineProperty(window, '__webmcpTools', { value: registry });
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool: async (
          tool: BrowserTool & { name: string },
          options?: { signal?: AbortSignal },
        ) => {
          registry.set(tool.name, tool);
          options?.signal?.addEventListener(
            'abort',
            () => {
              if (registry.get(tool.name) === tool) registry.delete(tool.name);
            },
            { once: true },
          );
        },
      },
    });
  });
  await page.goto('/lab');
  await page.getByRole('button', { name: 'WebMCP' }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { __webmcpTools: Map<string, BrowserTool> }
        ).__webmcpTools.has('search_demo_products'),
      ),
    )
    .toBe(true);

  const library = (await executeRegisteredTool(page, 'search_webmcp_library', {
    query: 'lifecycle cleanup',
    limit: 3,
  })) as { count: number; results: Array<{ slug: string }> };
  expect(library.count).toBeGreaterThan(0);
  expect(library.results.map((item) => item.slug)).toContain(
    'webmcp-lifecycle-single-page-apps',
  );
  const challenge = (await executeRegisteredTool(
    page,
    'get_challenge_pulse',
    {},
  )) as { submission_count: number | null; gallery_status: string };
  expect(challenge.submission_count).toBeNull();
  expect(challenge.gallery_status).toBe('not_published');

  const invalid = (await executeRegisteredTool(page, 'search_demo_products', {
    unexpected: true,
  })) as { ok: boolean; error: { code: string } };
  expect(invalid.ok).toBe(false);
  expect(invalid.error.code).toBe('INVALID_INPUT');

  await executeRegisteredTool(page, 'start_demo_run', {
    task_id: 'headset_research',
  });
  await executeRegisteredTool(page, 'search_demo_products', {
    category: 'headphones',
    max_price: 300,
    minimum_rating: 4.5,
    minimum_battery_hours: 30,
    features: ['noise_canceling'],
  });
  await executeRegisteredTool(page, 'compare_demo_products', {
    product_ids: ['aurora-q45', 'sonic-arc'],
  });
  await executeRegisteredTool(page, 'add_demo_product_to_cart', {
    product_id: 'aurora-q45',
    quantity: 1,
  });
  const completed = (await executeRegisteredTool(
    page,
    'finish_demo_run',
    {},
  )) as { success: boolean };
  expect(completed.success).toBe(true);
  await expect(page.getByText('Aurora Q45').last()).toBeVisible();

  const methodology = page.getByRole('link', { name: 'Methodology' });
  if (!(await methodology.isVisible())) {
    await page.getByLabel('Open primary navigation').click();
  }
  await methodology.click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const tools = (
          window as unknown as { __webmcpTools: Map<string, BrowserTool> }
        ).__webmcpTools;
        return {
          globalContentTool: tools.has('search_webmcp_library'),
          labTool: tools.has('start_demo_run'),
          catalogTool: tools.has('search_demo_products'),
        };
      }),
    )
    .toEqual({
      globalContentTool: true,
      labTool: false,
      catalogTool: false,
    });
});

test('primary navigation remains reachable at every configured viewport', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to main content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  const methodology = page.getByRole('link', { name: 'Methodology' });
  if (!(await methodology.isVisible())) {
    await expect(page.getByTestId('mobile-menu')).toBeHidden();
    await page.getByLabel('Open primary navigation').click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  }
  await methodology.click();
  await expect(
    page.getByRole('heading', { name: 'Presence is not readiness.' }),
  ).toBeVisible();
});

test('contract workbench exposes deterministic findings', async ({ page }) => {
  await page.goto('/workbench');
  await expect(
    page.getByRole('heading', {
      name: 'Find weak contracts before an agent does.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Current feature detection')).toBeVisible();
  await expect(page.getByText('Static evidence is provisional.')).toBeVisible();
});

test('learning center supports discovery and opens a source-linked guide', async ({
  page,
}) => {
  await page.goto('/learn');
  await expect(
    page.getByRole('heading', {
      name: 'From first principles to production evidence.',
    }),
  ).toBeVisible();
  await page.getByLabel('Search the library').fill('prompt injection');
  await expect(page.getByText('1 of 10 resources')).toBeVisible();
  await page
    .getByRole('link', {
      name: 'A practical security and privacy review for WebMCP tools',
    })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Threat-model the session and every exposed action',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Read the sources' }),
  ).toBeVisible();
});

test('FAQ and pulse preserve experimental status and challenge provenance', async ({
  page,
}) => {
  await page.goto('/faq');
  await page.getByRole('button', { name: 'Is WebMCP a W3C Standard?' }).click();
  await expect(page.getByText(/not on the W3C Standards Track/i)).toBeVisible();
  await page.goto('/pulse');
  await expect(
    page.getByRole('heading', { name: 'Registrations are not submissions.' }),
  ).toBeVisible();
  await expect(page.getByText('Not published', { exact: true })).toBeVisible();
  await expect(page.getByText(/no automated Devpost scraping/i)).toBeVisible();
});

test('RSS, sitemap, and content API expose attributed indexable content', async ({
  request,
}) => {
  const rss = await request.get('/feed.xml');
  expect(rss.ok()).toBe(true);
  expect(rss.headers()['content-type']).toContain('application/rss+xml');
  expect(await rss.text()).toContain('isWebMCP Learning &amp; Pulse');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('/learn/webmcp-vs-mcp');
  expect(sitemapBody).toMatch(
    /<loc>https:\/\/iswebmcp\.mlmrx\.chatgpt\.site\/pulse<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/,
  );

  const methodology = await request.get('/methodology');
  expect(methodology.ok()).toBe(true);
  const methodologyHtml = await methodology.text();
  expect(methodologyHtml).toContain(
    'href="https://iswebmcp.mlmrx.chatgpt.site/methodology"',
  );
  expect(methodologyHtml).not.toContain(
    'rel="canonical" href="https://iswebmcp.mlmrx.chatgpt.site"',
  );

  const content = await request.get('/api/content');
  expect(content.ok()).toBe(true);
  const payload = (await content.json()) as {
    articles: unknown[];
    challenge: { submissionCount: number | null };
  };
  expect(payload.articles.length).toBeGreaterThanOrEqual(10);
  expect(payload.challenge.submissionCount).toBeNull();
});
