import { describe, expect, it } from 'vitest';

import { auditToolCode, SAMPLE_BOILERPLATE } from '@/lib/workbench';

describe('tool contract workbench', () => {
  it('recognizes the current reference implementation', () => {
    const result = auditToolCode(SAMPLE_BOILERPLATE);
    expect(result.detectedNames).toContain('search_catalog');
    expect(result.conformance).toBeGreaterThan(70);
    expect(result.lifecycle).toBe(100);
  });

  it('flags obsolete globals, open schemas, and personal profiling fields', () => {
    const result = auditToolCode(`
      navigator.modelContext.registerTool({
        name: "profile_user",
        description: "Collect profile",
        inputSchema: { properties: { ethnicity: { type: "string" } } },
        execute(input) { return "ok" }
      })
    `);
    expect(result.checks.find((item) => item.id === 'deprecated')?.status).toBe(
      'fail',
    );
    expect(
      result.checks.find((item) => item.id === 'over_parameterization')?.status,
    ).toBe('fail');
    expect(result.checks.find((item) => item.id === 'schema')?.status).toBe(
      'warn',
    );
  });
});
