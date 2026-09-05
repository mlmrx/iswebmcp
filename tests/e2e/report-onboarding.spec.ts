import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { analyzeSource } from '../../lib/scanner';
import { sourceComparisonContext } from '../../lib/integrations/comparison-context';
import {
  compare,
  validateSummary,
} from '../../integrations/developer-kit/index.mjs';

test('source finding leads to evidence, a valid CI baseline, and a deliberate repeat check', async ({
  page,
}, testInfo) => {
  // Controlled source fixture, not an external-site observation or runtime trial.
  const html = '<main><h1>Search</h1><input></main>';
  const fixture = {
    ...analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html,
      status: 200,
      contentType: 'text/html',
      bytesRead: html.length,
      redirects: 0,
    }),
    comparisonContext: sourceComparisonContext({
      requestedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      analysisLimitBytes: 1_000_000,
    }),
  };
  let requests = 0;
  await page.route('**/api/scans', async (route) => {
    requests += 1;
    await route.fulfill({ status: 201, json: fixture });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Help AI agents',
  );
  await page.screenshot({
    path: testInfo.outputPath('home.png'),
    fullPage: false,
  });
  await page.getByLabel('Public URL').fill('example.com');
  await page.getByRole('button', { name: 'Check my website' }).click();
  await expect(
    page.getByRole('heading', { name: /source-level issue/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Four evidence boundaries. No blended score.',
    }),
  ).toBeHidden();
  await page
    .getByText('Inspect supporting evidence', { exact: true })
    .first()
    .click();
  await expect(page.getByText(/source · .* confidence/).first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('report.png'),
    fullPage: true,
  });
  const download = page.waitForEvent('download');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('#report-details')).toHaveAttribute('open', '');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#report-details')).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Export CI baseline' }).click();
  const file = await download;
  const summary = JSON.parse(await readFile((await file.path())!, 'utf8'));
  expect(validateSummary(summary)).toBe(summary);
  expect(compare(summary, summary)).toMatchObject({ regressed: false });
  await page
    .getByRole('button', { name: 'Review URL and check again' })
    .click();
  await expect(page.getByLabel('Public URL')).toHaveValue(
    'https://example.com/',
  );
  expect(requests).toBe(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
});

test('resource menus close on Escape and restore keyboard focus', async ({
  page,
}) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  const mobile = page.getByLabel('Open primary navigation');
  const toggle = (await mobile.isVisible())
    ? mobile
    : nav.getByText('Resources', { exact: true });
  await toggle.click();
  const link = nav.getByRole('link', { name: 'Methodology', exact: true });
  await expect(link).toBeVisible();
  await link.focus();
  await page.keyboard.press('Escape');
  await expect(link).toBeHidden();
  await expect(toggle).toBeFocused();
});
