import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

const offlineZip = '/developer-tools/iswebmcp-offline-checker-0.2.0.zip';
const checksumPath =
  '/developer-tools/iswebmcp-offline-checker-0.2.0.checksums.json';
const existingToolkit = '/developer-tools/iswebmcp-developer-tools-0.2.0.zip';

test('developers can choose offline HTML without replacing the public URL toolkit', async ({
  page,
}, testInfo) => {
  await page.goto('/developers');
  await expect(
    page.getByRole('heading', { name: 'Have a public URL?' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Have an exported HTML file?' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Download developer tools', exact: true }),
  ).toHaveAttribute('href', existingToolkit);
  await page.getByRole('link', { name: 'Offline Checker quickstart' }).click();
  await expect(page).toHaveURL('/developers/offline');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Check an HTML file. See what changed.',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('isWebMCP Offline Checker', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/enterprise"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('offline-checker.png') });
  await page
    .getByRole('link', { name: 'Developer tools', exact: true })
    .click();
  await expect(page).toHaveURL('/developers');
});

test('offline page exposes working ZIP and checksum downloads for this version', async ({
  page,
  request,
}) => {
  await page.goto('/developers/offline');
  await expect(
    page.getByRole('link', { name: 'Download Offline Checker ZIP' }),
  ).toHaveAttribute('href', offlineZip);
  await expect(
    page.getByRole('link', { name: 'Download SHA-256 checksums' }),
  ).toHaveAttribute('href', checksumPath);
  const archive = await request.get(offlineZip);
  expect(archive.status()).toBe(200);
  const archiveBytes = await archive.body();
  expect(archiveBytes.subarray(0, 4).toString('hex')).toBe('504b0304');
  const checksums = await request.get(checksumPath);
  expect(checksums.status()).toBe(200);
  const ledger = await checksums.json();
  expect(ledger.version).toBe('0.2.0');
  expect(ledger.filename).toBe('iswebmcp-offline-checker-0.2.0.zip');
  expect(ledger.bytes).toBe(archiveBytes.length);
  expect(ledger.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(ledger.sha256).toBe(
    createHash('sha256').update(archiveBytes).digest('hex'),
  );
});

test('offline quickstart explains real commands, limits, and inconclusive evidence', async ({
  page,
}) => {
  await page.goto('/developers/offline');
  await page.getByRole('link', { name: 'Run the included example' }).click();
  await expect(page).toHaveURL('/developers/offline#quickstart');
  const quickstart = page.getByRole('region', {
    name: 'Try a real fix in three steps',
  });
  await expect(quickstart.locator('ol > li')).toHaveCount(3);
  await expect(
    quickstart.getByText('node examples/run-demo.mjs', { exact: true }),
  ).toBeVisible();
  await expect(quickstart).toContainText('examples/before.html');
  await expect(quickstart).toContainText('examples/after.html');
  await expect(quickstart).toContainText('new output folder');
  const commands = page.getByLabel('Audit and compare your own exported HTML');
  await expect(commands).toContainText(
    'node iswebmcp-offline.mjs audit ./export.html --app catalog-search --output ./baseline.json',
  );
  await expect(commands).toContainText(
    'node iswebmcp-offline.mjs compare ./baseline.json ./current.json --output ./comparison.json',
  );
  const ci = page.getByRole('region', {
    name: 'Use the same commands in local CI',
  });
  await expect(ci).toContainText('Exit 0 — the command completed');
  await expect(ci).toContainText('Existing problems may remain.');
  await expect(ci).toContainText('Exit 1 — comparison found a regression');
  await expect(ci).toContainText('Exit 2 — no conclusive comparison or audit');
  await expect(ci).toContainText('A change from pass to not observed is shown');
  const limits = page.getByRole('region', {
    name: 'Know the boundary before using sensitive HTML',
  });
  await expect(limits).toContainText('up to 2 MiB');
  await expect(limits).toContainText('5-second time limit');
  await expect(limits).toContainText('128 MiB old-generation heap limit');
  await expect(limits).toContainText('16 MiB young-generation limit');
  await expect(limits).toContainText(
    'No HTTP requests to public or private hosts',
  );
  await expect(limits).toContainText(
    'not an OS-level network-isolation guarantee',
  );
  await expect(page.getByRole('main')).toContainText(
    'Runtime is always unknown',
  );
  await expect(page.getByRole('main')).toContainText(
    'does not automatically edit your app',
  );
});

test('offline quickstart stays readable at a narrow mobile width', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/developers/offline');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const layout = await page.evaluate(() => ({
    pageWidth: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.contentWidth).toBeLessThanOrEqual(layout.pageWidth + 1);
  await page.screenshot({
    path: testInfo.outputPath('offline-checker-narrow.png'),
  });
  const commands = page.getByLabel('Audit and compare your own exported HTML');
  await expect(commands).toHaveAttribute('tabindex', '0');
  await commands.focus();
  await expect(commands).toBeFocused();
  const codeBox = await commands.boundingBox();
  expect(codeBox).not.toBeNull();
  expect(codeBox!.x).toBeGreaterThanOrEqual(0);
  expect(codeBox!.x + codeBox!.width).toBeLessThanOrEqual(321);
});
