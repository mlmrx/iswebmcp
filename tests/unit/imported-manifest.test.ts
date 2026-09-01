import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/imports/tool-manifest/route';
import {
  auditImportedManifest,
  deriveReportWithImportedAudit,
  importedManifestRequestSchema,
} from '@/lib/imported-manifest';
import { putReport } from '@/lib/scan-store';
import { makeDemoReport } from '@/lib/scanner';

const now = new Date('2026-08-31T20:00:00.000Z');

function strongManifest() {
  return {
    tools: [
      {
        name: 'search_catalog',
        description:
          'Search the visible catalog using explicit product constraints.',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string', maxLength: 120 } },
          required: ['query'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
      },
      {
        name: 'compare_products',
        description:
          'Compare selected product records using stable identifiers.',
        inputSchema: {
          type: 'object',
          properties: {
            product_ids: { type: 'array', minItems: 2, maxItems: 4 },
          },
          required: ['product_ids'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
      },
      {
        name: 'add_product_to_cart',
        description: 'Add one selected product to the visible synthetic cart.',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              description: 'Stable product identifier.',
            },
            quantity: { type: 'integer', minimum: 1, maximum: 5 },
          },
          required: ['product_id', 'quantity'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        stateEffects: 'Updates the visible synthetic cart only.',
      },
    ],
  };
}

describe('imported contract audit', () => {
  it('caps contract-only evidence coverage and leaves behavioral categories unobserved', () => {
    const report = makeDemoReport();
    const input = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: strongManifest(),
    });
    const audit = auditImportedManifest(input, report, now);

    expect(audit.quality.coverage).toBe(65);
    expect(audit.matchedActionIds).toHaveLength(3);
    expect(audit.independentlyVerified).toBe(false);
    expect(
      audit.quality.categories.find((item) => item.id === 'outputs')?.score,
    ).toBeNull();
    expect(
      audit.quality.categories.find((item) => item.id === 'state')?.score,
    ).toBeNull();
    expect(
      audit.quality.categories.find((item) => item.id === 'errors')?.score,
    ).toBeNull();
    expect(
      audit.findings
        .filter((item) => item.status === 'not_observed')
        .every((item) => item.priority === 'P1'),
    ).toBe(true);
  });

  it('does not reward malformed schemas and one-character descriptions as excellent contracts', () => {
    const report = makeDemoReport();
    const input = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: [
        {
          name: 'search',
          description: 'x',
          inputSchema: {
            type: 'object',
            properties: [],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
        },
      ],
    });
    const audit = auditImportedManifest(input, report, now);
    expect(audit.quality.value).toBeLessThan(70);
    expect(
      audit.quality.categories.find((item) => item.id === 'schemas')?.score,
    ).toBeLessThan(60);
  });

  it('requires the action verb and does not inflate coverage from a shared object noun', () => {
    const report = makeDemoReport();
    const input = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: [
        {
          name: 'get_product',
          description: 'Get one product record using its stable identifier.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
        },
      ],
    });
    expect(
      auditImportedManifest(input, report, now).matchedActionIds,
    ).toHaveLength(0);
  });

  it('does not manufacture coverage from action verbs listed only in a description', () => {
    const report = makeDemoReport();
    const input = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: [
        {
          name: 'product_helper',
          description:
            'This broad helper can search, compare, add, export, and save product data.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
        },
      ],
    });
    expect(
      auditImportedManifest(input, report, now).matchedActionIds,
    ).toHaveLength(0);
  });

  it('retains bounded summaries instead of raw schema values', () => {
    const report = makeDemoReport();
    const manifest = strongManifest();
    manifest.tools[0].inputSchema.properties.query = {
      type: 'string',
      maxLength: 120,
      enum: ['CUSTOMER_ALPHA'],
      default: 'CUSTOMER_BETA',
    } as never;
    const input = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest,
    });
    const audit = auditImportedManifest(input, report, now);
    const serialized = JSON.stringify(audit);
    expect(serialized).not.toContain('CUSTOMER_ALPHA');
    expect(serialized).not.toContain('CUSTOMER_BETA');
    expect(audit.tools[0].inputSchema.propertyNames).toContain('query');
  });

  it('rejects credential-like text, prototype keys, excessive depth, and origin mismatch', () => {
    const report = makeDemoReport();
    const credential = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: [
        {
          name: 'search',
          description: 'Bearer abcdefghijklmnopqrstuvwxyz',
          annotations: {},
        },
      ],
    });
    expect(() => auditImportedManifest(credential, report, now)).toThrow(
      'CREDENTIAL_LIKE_DATA',
    );

    const polluted = JSON.parse(
      '{"tools":[{"name":"search","description":"Search the visible catalog safely.","inputSchema":{"type":"object","__proto__":{"x":1}}}]}',
    ) as unknown;
    const pollutedInput = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: polluted,
    });
    expect(() => auditImportedManifest(pollutedInput, report, now)).toThrow(
      'UNSAFE_SCHEMA',
    );

    const deepSchema: Record<string, unknown> = { type: 'object' };
    let cursor = deepSchema;
    for (let index = 0; index < 14; index += 1) {
      const next: Record<string, unknown> = {};
      cursor.properties = { nested: next };
      cursor = next;
    }
    const deep = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: [
        {
          name: 'search',
          description: 'Search the visible catalog safely.',
          inputSchema: deepSchema,
        },
      ],
    });
    expect(() => auditImportedManifest(deep, report, now)).toThrow(
      'UNSAFE_SCHEMA',
    );

    const mismatch = importedManifestRequestSchema.parse({
      scanId: report.id,
      manifest: {
        format: 'iswebmcp-tool-manifest/v1',
        captureMethod: 'same_origin_probe',
        pageUrl: 'https://unrelated.example/tools',
        capturedAt: now.toISOString(),
        tools: strongManifest().tools,
      },
    });
    expect(() => auditImportedManifest(mismatch, report, now)).toThrow(
      'ORIGIN_MISMATCH',
    );
  });

  it('creates an immutable derived report and replaces prior imported evidence cleanly', () => {
    const original = makeDemoReport();
    const firstInput = importedManifestRequestSchema.parse({
      scanId: original.id,
      manifest: strongManifest(),
    });
    const first = deriveReportWithImportedAudit(
      original,
      auditImportedManifest(firstInput, original, now),
    );
    const secondInput = importedManifestRequestSchema.parse({
      scanId: first.id,
      manifest: strongManifest(),
    });
    const second = deriveReportWithImportedAudit(
      first,
      auditImportedManifest(secondInput, first, now),
    );

    expect(original.importedProof).toBeUndefined();
    expect(first.id).not.toBe(original.id);
    expect(second.id).not.toBe(first.id);
    expect(second.parentReportId).toBe(original.id);
    expect(second.limitations).toEqual([...new Set(second.limitations)]);
    expect(
      second.strongestEvidence.filter((item) =>
        /imported tool contract/i.test(item),
      ),
    ).toHaveLength(1);
  });
});

describe('manifest import API', () => {
  it('binds an import to a stored report and persists the derived report', async () => {
    const report = makeDemoReport();
    putReport(report);
    const response = await POST(
      new Request('http://localhost/api/imports/tool-manifest', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ scanId: report.id, manifest: strongManifest() }),
      }),
    );
    const payload = (await response.json()) as {
      id: string;
      parentReportId: string;
      importedProof: { sourceReportId: string };
    };
    expect(response.status).toBe(201);
    expect(payload.id).not.toBe(report.id);
    expect(payload.parentReportId).toBe(report.id);
    expect(payload.importedProof.sourceReportId).toBe(report.id);
  });

  it('rejects missing reports and non-JSON requests', async () => {
    const missing = await POST(
      new Request('http://localhost/api/imports/tool-manifest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scanId: 'scan_aaaaaaaaaaaa',
          manifest: strongManifest(),
        }),
      }),
    );
    expect(missing.status).toBe(404);

    const wrongType = await POST(
      new Request('http://localhost/api/imports/tool-manifest', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{}',
      }),
    );
    expect(wrongType.status).toBe(415);

    const jsonp = await POST(
      new Request('http://localhost/api/imports/tool-manifest', {
        method: 'POST',
        headers: { 'content-type': 'application/jsonp' },
        body: '{}',
      }),
    );
    expect(jsonp.status).toBe(415);
  });
});
