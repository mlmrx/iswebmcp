import { expect, test } from '@playwright/test';

test('adoption research reconciles sources and supports ecosystem exploration', async ({
  page,
}) => {
  await page.goto('/adoption');
  await expect(
    page.getByRole('heading', { name: 'One market, four different questions' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /independently detected hosts appear in the external directory/,
    }),
  ).toBeVisible();
  await expect(page.getByText('Append-only market snapshots')).toBeVisible();

  const status = page.locator('#ecosystem-atlas p[aria-live="polite"]');
  await expect(status).toContainText(/\d+ of \d+ indexed sites match/);
  await page
    .getByPlaceholder('Search site, category, or tool')
    .fill('search_docs');
  await expect(status).toContainText(/^[1-9]\d* of \d+ indexed sites match$/);

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
});

test('ecosystem JSON preserves history, reconciliation, and evidence scope', async ({
  request,
}) => {
  const response = await request.get('/adoption/ecosystem.json');
  expect(response.ok()).toBe(true);
  const dataset = await response.json();
  expect(dataset.source.evidenceLevel).toBe('third-party-indexed');
  expect(dataset.sites.length).toBe(dataset.summary.directorySites);
  expect(dataset.history.length).toBeGreaterThan(0);
  expect(dataset.history[0].digest).toBe(dataset.digest);
  expect(
    dataset.independentCensusComparison.overlapCount +
      dataset.independentCensusComparison.independentOnlyCount,
  ).toBe(dataset.independentCensusComparison.independentDetectionCount);
  expect(dataset.citationPolicy).toContain(
    'not independent runtime verification',
  );
});
