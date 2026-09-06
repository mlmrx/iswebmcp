import { describe, expect, it } from 'vitest';

import { GET as getWithdrawnEnterprise } from '@/app/enterprise/[[...path]]/route';
import { GET as getSitemap } from '@/app/sitemap.xml/route';
import { enterpriseScenarios } from '@/lib/enterprise/scenarios';
import { partnerProspects } from '@/lib/enterprise/partners';
import {
  enterpriseDisclosure,
  fitCriteria,
  fitTotal,
  partnerDisclosure,
  pilotWorksheet,
  rankedPartners,
  researchPackMarkdown,
  researchReviewedAt,
} from '@/lib/enterprise/research';

const officialDomains: Record<string, readonly string[]> = {
  Cisco: ['cisco.com'],
  Akamai: ['akamai.com', 'akamai.github.io'],
  Microsoft: ['microsoft.com'],
  Adobe: ['adobe.com'],
  Salesforce: ['salesforce.com'],
  Vercel: ['vercel.com'],
  Cloudflare: ['cloudflare.com'],
  Lovable: ['lovable.dev'],
  Browserbase: ['browserbase.com'],
  GoDaddy: ['godaddy.com'],
};

function expectDate(value: string) {
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(new Date(value).toISOString().slice(0, 10)).toBe(value);
}

function expectOfficialUrl(company: string, input: string) {
  const url = new URL(input);
  expect(url.protocol).toBe('https:');
  expect(url.username).toBe('');
  expect(url.password).toBe('');
  expect(url.hostname).not.toMatch(/(^|\.)devpost\.com$/);
  expect(
    officialDomains[company]?.some(
      (domain) =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    ),
  ).toBe(true);
}

describe('private retained enterprise research integrity', () => {
  it('keeps exactly five illustrative scenarios and five uncontacted prospects', () => {
    expect(enterpriseScenarios.map((item) => item.company).sort()).toEqual(
      ['Cisco', 'Akamai', 'Microsoft', 'Adobe', 'Salesforce'].sort(),
    );
    expect(partnerProspects.map((item) => item.company).sort()).toEqual(
      ['GoDaddy', 'Lovable', 'Cloudflare', 'Vercel', 'Browserbase'].sort(),
    );
    expect(
      enterpriseScenarios.every(
        (item) => item.status === 'illustrative-not-validated',
      ),
    ).toBe(true);
    expect(
      partnerProspects.every(
        (item) => item.status === 'prospect-not-contacted',
      ),
    ).toBe(true);
    expect(enterpriseDisclosure).toMatch(/not a customer case study/i);
    expect(partnerDisclosure).toMatch(/not an existing partner/i);
  });

  it('uses unique, dated official sources and resolves every factual citation', () => {
    const dossiers = [...enterpriseScenarios, ...partnerProspects];
    const allSourceIds: string[] = [];
    expectDate(researchReviewedAt);
    expect(new Set(dossiers.map((item) => item.slug)).size).toBe(10);

    for (const dossier of dossiers) {
      expect(dossier.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expectDate(dossier.reviewedAt);
      expect(dossier.reviewedAt <= researchReviewedAt).toBe(true);
      expect(dossier.context.length).toBeGreaterThan(0);
      expect(dossier.sources.length).toBeGreaterThan(0);
      const sourceIds = new Set(dossier.sources.map((source) => source.id));
      const sourceUrls = new Set(dossier.sources.map((source) => source.url));
      expect(sourceIds.size).toBe(dossier.sources.length);
      expect(sourceUrls.size).toBe(dossier.sources.length);
      for (const source of dossier.sources) {
        allSourceIds.push(source.id);
        expect(source.title.trim().length).toBeGreaterThan(0);
        expectOfficialUrl(dossier.company, source.url);
        expectDate(source.accessedAt);
        expect(source.accessedAt <= dossier.reviewedAt).toBe(true);
        if (source.publishedAt !== null) {
          expectDate(source.publishedAt);
          expect(source.publishedAt <= source.accessedAt).toBe(true);
        }
      }
      for (const fact of dossier.context) {
        expect(fact.claim.trim().length).toBeGreaterThan(0);
        expect(fact.sourceIds.length).toBeGreaterThan(0);
        expect(new Set(fact.sourceIds).size).toBe(fact.sourceIds.length);
        expect(fact.sourceIds.every((id) => sourceIds.has(id))).toBe(true);
      }
    }
    expect(new Set(allSourceIds).size).toBe(allSourceIds.length);
  });

  it('requires current-versus-unbuilt boundaries, stop conditions, and qualified contact routes', () => {
    for (const dossier of [...enterpriseScenarios, ...partnerProspects]) {
      for (const items of [
        dossier.availableNow,
        dossier.requiresWork,
        dossier.risks,
        dossier.pilot.deliverables,
        dossier.pilot.successSignals,
        dossier.pilot.stopConditions,
      ]) {
        expect(items.length).toBeGreaterThan(0);
        expect(items.every((item) => item.trim().length > 0)).toBe(true);
      }
      expect(dossier.pilot.scope).toMatch(/proposed/i);
    }
    for (const partner of partnerProspects) {
      expectOfficialUrl(partner.company, partner.contact.url);
      expect(partner.contact.label.trim().length).toBeGreaterThan(0);
      expect(partner.contact.qualification.trim().length).toBeGreaterThan(0);
      expect(partner.integration.length).toBeGreaterThan(0);
    }
  });

  it('bounds every editorial fit criterion and ranks without losing prospects', () => {
    expect(fitCriteria).toHaveLength(5);
    expect(new Set(fitCriteria.map((item) => item.key)).size).toBe(5);
    for (const partner of partnerProspects) {
      const scores = fitCriteria.map((criterion) => partner.fit[criterion.key]);
      expect(
        scores.every(
          (score) => Number.isInteger(score) && score >= 0 && score <= 2,
        ),
      ).toBe(true);
      expect(fitTotal(partner)).toBe(
        scores.reduce((sum, value) => sum + value, 0),
      );
      expect(partner.fit.rationale).toMatch(/editorial inference/i);
    }
    expect(rankedPartners.map((item) => item.slug).sort()).toEqual(
      partnerProspects.map((item) => item.slug).sort(),
    );
    const totals = rankedPartners.map(fitTotal);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
    for (let index = 1; index < rankedPartners.length; index += 1) {
      const previous = rankedPartners[index - 1];
      const current = rankedPartners[index];
      if (fitTotal(previous) !== fitTotal(current)) continue;
      expect(previous.fit.currentUtility).toBeGreaterThanOrEqual(
        current.fit.currentUtility,
      );
      if (previous.fit.currentUtility !== current.fit.currentUtility) continue;
      expect(previous.fit.reusableDistribution).toBeGreaterThanOrEqual(
        current.fit.reusableDistribution,
      );
      if (
        previous.fit.reusableDistribution !== current.fit.reusableDistribution
      )
        continue;
      expect(
        previous.company.localeCompare(current.company),
      ).toBeLessThanOrEqual(0);
    }
  });

  it('retains internal text generation with sources, dates, and no implied results', () => {
    const pack = researchPackMarkdown();
    expect(pack).toBe(researchPackMarkdown());
    expect(pack).toContain(enterpriseDisclosure);
    expect(pack).toContain(partnerDisclosure);
    expect(pack).toContain('WebMCP remains experimental');
    expect(pack).toContain(
      'CLI scans still send approved inputs to the hosted service',
    );
    expect(pack).toContain('No private runner');
    expect(pack).toContain('not a market ranking');
    expect(pack).toContain('0 = weak/unestablished');
    expect(pack).toContain('not adoption, endorsement, integration validation');
    expect(pack).not.toMatch(/\bundefined\b|\[object Object\]/);
    for (const dossier of [...enterpriseScenarios, ...partnerProspects]) {
      expect(pack).toContain(`### ${dossier.company}: ${dossier.title}`);
      expect(pack).toContain(dossier.pilot.scope);
      for (const item of dossier.requiresWork) expect(pack).toContain(item);
      for (const item of dossier.pilot.stopConditions)
        expect(pack).toContain(item);
      for (const source of dossier.sources) {
        expect(pack).toContain(`[${source.title}](${source.url})`);
        expect(pack).toContain(`checked ${source.accessedAt}`);
      }
    }
    expect(pack).toContain(pilotWorksheet);
  });

  it('keeps the retained worksheet private-by-default and decision-oriented', () => {
    for (const required of [
      'no results collected',
      'retain privately',
      'no secrets',
      '90 days',
      'no access controls will change',
      'request budget',
      'retention and deletion owner',
      'input fingerprint',
      'complete collection/inventory',
      'false alarm, or unresolved',
      'Missing evidence is not proof of a fix',
      'voluntarily retained',
      'NOT MEASURED',
      'explicit written permission',
      'No security certification',
    ])
      expect(pilotWorksheet).toContain(required);
  });

  it('withdraws all enterprise routes without exposing any dossier or download', async () => {
    const response = getWithdrawnEnterprise();
    expect(response.status).toBe(410);
    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(response.headers.get('content-disposition')).toBeNull();
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    const body = await response.text();
    expect(body).toBe('This page is no longer available.\n');
    for (const dossier of [...enterpriseScenarios, ...partnerProspects]) {
      expect(body).not.toContain(dossier.company);
      expect(body).not.toContain(dossier.title);
      expect(body).not.toContain(dossier.summary);
    }
  });

  it('does not publish enterprise research in the sitemap', async () => {
    const response = getSitemap();
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('/enterprise');
  });
});
