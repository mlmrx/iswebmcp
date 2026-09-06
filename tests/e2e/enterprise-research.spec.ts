import { expect, test } from '@playwright/test';
import { enterpriseScenarios } from '../../lib/enterprise/scenarios';
import { partnerProspects } from '../../lib/enterprise/partners';

const withdrawnPaths = [
  '/enterprise',
  '/enterprise/scenarios',
  '/enterprise/partners',
  '/enterprise/research-pack',
  '/enterprise/pilot-worksheet',
  ...enterpriseScenarios.map((item) => `/enterprise/scenarios/${item.slug}`),
  ...partnerProspects.map((item) => `/enterprise/partners/${item.slug}`),
];

test('all withdrawn enterprise pages and downloads return a non-cacheable 410 without research', async ({
  request,
}) => {
  expect(withdrawnPaths).toHaveLength(15);
  for (const path of withdrawnPaths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(410);
    expect(response.headers()['content-type']).toContain('text/plain');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
    expect(response.headers()['content-disposition']).toBeUndefined();
    const body = await response.text();
    expect(body).toBe('This page is no longer available.\n');
    for (const dossier of [...enterpriseScenarios, ...partnerProspects]) {
      expect(body).not.toContain(dossier.company);
      expect(body).not.toContain(dossier.title);
      expect(body).not.toContain(dossier.summary);
    }
  }
  expect((await request.get('/enterprise/unknown/descendant')).status()).toBe(
    410,
  );
});

test('public navigation and sitemap do not expose withdrawn enterprise research', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.locator('a[href^="/enterprise"]')).toHaveCount(0);
  await expect(
    page.locator('a[href^="https://iswebmcp.com/enterprise"]'),
  ).toHaveCount(0);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain('/enterprise');
});
