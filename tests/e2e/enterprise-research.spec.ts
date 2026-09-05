import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { enterpriseScenarios } from '../../lib/enterprise/scenarios';
import { partnerProspects } from '../../lib/enterprise/partners';

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
}

test('enterprise research stays separate and is reachable through Resources', async ({
  page,
}) => {
  await page.goto('/');
  const primaryNav = page.getByRole('navigation', {
    name: 'Primary',
    exact: true,
  });
  const mobileToggle = page.getByLabel('Open primary navigation');
  if (await mobileToggle.isVisible()) await mobileToggle.click();
  else await primaryNav.getByText('Resources', { exact: true }).click();
  await primaryNav
    .getByRole('link', { name: 'Enterprise pilots', exact: true })
    .click();
  await expect(page).toHaveURL('/enterprise');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Bring agent-readiness evidence',
  );
  await expect(
    page.getByRole('complementary', { name: 'Offering status' }),
  ).toContainText('not customers, partners, or endorsers');
  await expect(
    page.getByRole('heading', { name: 'Useful today', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Requires a separate development phase',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Running the CLI inside your CI does not make the scan private/,
    ),
  ).toContainText('90 days');
  await expectNoHorizontalOverflow(page);

  await page
    .getByRole('link', { name: 'Explore five enterprise scenarios' })
    .click();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page
    .getByRole('navigation', { name: 'Enterprise research' })
    .getByRole('link', { name: 'Partner shortlist' })
    .click();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(
    page.getByRole('heading', { name: 'Selection method and limits' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('enterprise and partner details retain visible proposals, official citations, and limits', async ({
  page,
}, testInfo) => {
  const scenario = enterpriseScenarios.find(
    (item) => item.company === 'Cisco',
  )!;
  await page.goto(`/enterprise/scenarios/${scenario.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    scenario.title,
  );
  await expect(
    page.getByRole('complementary', { name: 'Research status' }),
  ).toContainText('not a customer case study');
  await expect(
    page.getByRole('heading', {
      name: 'Our proposed workflow—not a deployed integration',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Source and date ledger' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('link', { name: scenario.sources[0].title, exact: false })
      .first(),
  ).toHaveAttribute('href', scenario.sources[0].url);
  await expect(
    page
      .getByText(
        `Publication date: not established · Checked: ${scenario.reviewedAt}`,
      )
      .first(),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath('enterprise-scenario.png'),
    fullPage: true,
  });

  const partner = partnerProspects.find(
    (item) => item.company === 'Cloudflare',
  )!;
  await page.goto(`/enterprise/partners/${partner.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    partner.title,
  );
  await expect(
    page.getByRole('complementary', { name: 'Research status' }),
  ).toContainText('not an existing partner');
  await expect(
    page.getByRole('heading', { name: /editorial fit/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'What needs development or partner agreement',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Measures to collect—not results' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('link', { name: partner.sources[0].title, exact: false })
      .first(),
  ).toHaveAttribute('href', partner.sources[0].url);
  await expect(
    page.getByText(/No message or application has been sent for this proposal/),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('research downloads preserve disclosures and every brief resolves without external scans', async ({
  page,
  request,
}) => {
  await page.goto('/enterprise');
  const researchDownload = page.waitForEvent('download');
  await page
    .getByRole('navigation', { name: 'Enterprise research' })
    .getByRole('link', { name: 'Download research pack' })
    .click();
  const packFile = await researchDownload;
  expect(packFile.suggestedFilename()).toBe(
    'iswebmcp-enterprise-research-2026-09-05.md',
  );
  expect(await packFile.failure()).toBeNull();
  const pack = await readFile((await packFile.path())!, 'utf8');
  expect(pack).toContain('not a customer case study');
  expect(pack).toContain('No outreach has been sent');

  const worksheetDownload = page.waitForEvent('download');
  await page
    .getByRole('link', { name: 'Download pilot worksheet', exact: true })
    .click();
  const worksheetFile = await worksheetDownload;
  expect(worksheetFile.suggestedFilename()).toBe(
    'iswebmcp-enterprise-pilot-worksheet.md',
  );
  const worksheet = await readFile((await worksheetFile.path())!, 'utf8');
  expect(worksheet).toContain('no results collected');
  expect(worksheet).toContain('90 days');
  expect(worksheet).toContain('explicit written permission');

  for (const [group, dossiers] of [
    ['scenarios', enterpriseScenarios],
    ['partners', partnerProspects],
  ] as const) {
    for (const dossier of dossiers) {
      const response = await request.get(
        `/enterprise/${group}/${dossier.slug}`,
      );
      expect(response.status(), `${group}/${dossier.slug}`).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      const body = await response.text();
      expect(body).toContain(dossier.title);
      expect(body).toContain('Source and date ledger');
      expect(pack).toContain(`### ${dossier.company}: ${dossier.title}`);
    }
    expect(
      (
        await request.get(`/enterprise/${group}/not-a-researched-company`)
      ).status(),
    ).toBe(404);
  }
});
