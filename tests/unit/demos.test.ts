import { describe, expect, it } from 'vitest';

import {
  demoCategories,
  demoCategoryDetails,
  demoScenarios,
  getDemoScenario,
} from '@/lib/demos';

describe('interactive demo registry', () => {
  it('publishes exactly 24 unique patterns with six in every category', () => {
    const slugs = demoScenarios.map((scenario) => scenario.slug);
    const toolNames = demoScenarios.map((scenario) => scenario.tool.name);

    expect(demoScenarios).toHaveLength(24);
    expect(slugs).toHaveLength(24);
    expect(new Set(slugs).size).toBe(24);
    expect(toolNames).toHaveLength(24);
    expect(new Set(toolNames).size).toBe(24);

    for (const category of demoCategories) {
      expect(
        demoScenarios.filter((scenario) => scenario.category === category),
      ).toHaveLength(6);
      expect(demoCategoryDetails[category].label).toBeTruthy();
    }
  });

  it('keeps every pattern interactive, verifiable, and honestly labeled', () => {
    for (const scenario of demoScenarios) {
      expect(scenario.before.title).toBeTruthy();
      expect(scenario.before.framing).toBeTruthy();
      expect(scenario.before.steps.length).toBeGreaterThanOrEqual(3);
      expect(scenario.after.title).toBeTruthy();
      expect(scenario.after.framing).toBeTruthy();
      expect(scenario.after.steps.length).toBeGreaterThanOrEqual(3);
      for (const flow of [scenario.before, scenario.after]) {
        for (const step of flow.steps) {
          expect(step.label).toBeTruthy();
          expect(step.detail).toBeTruthy();
          expect(step.state).toBeTruthy();
        }
      }
      expect(scenario.verification.question).toBeTruthy();
      expect(scenario.verification.beforeState).toBeTruthy();
      expect(scenario.verification.afterState).toBeTruthy();
      expect(scenario.verification.checks.length).toBeGreaterThanOrEqual(2);
      for (const check of scenario.verification.checks) {
        expect(check).toBeTruthy();
      }
      expect(scenario.confirmation.level).toBeTruthy();
      expect(scenario.confirmation.trigger).toBeTruthy();
      expect(scenario.confirmation.behavior).toBeTruthy();
      expect(scenario.confirmation.rationale).toBeTruthy();
      expect(scenario.evidenceLabel).toBe('Illustrative synthetic pattern');
      expect(scenario.tool.description.length).toBeLessThanOrEqual(160);
      expect(scenario.tool.inputSchema).toMatchObject({
        type: 'object',
        additionalProperties: false,
      });
      expect(Object.keys(scenario.tool.exampleInput).length).toBeGreaterThan(0);
      expect(Object.keys(scenario.tool.exampleResult).length).toBeGreaterThan(
        0,
      );
      expect(getDemoScenario(scenario.slug)).toBe(scenario);
    }
  });

  it('contains no numeric timing, percentage, multiplier, or lift claims', () => {
    const registryText = JSON.stringify(demoScenarios).toLowerCase();

    expect(registryText).not.toMatch(
      /\b\d+(?:\.\d+)?\s*(?:%|ms|milliseconds?|seconds?|minutes?|hours?|x)\b/,
    );
    expect(registryText).not.toMatch(/\blift\b/);
  });

  it('uses compact, stable tool names', () => {
    for (const scenario of demoScenarios) {
      expect(scenario.tool.name).toMatch(/^[a-z][a-z0-9_]{1,63}$/);
    }
  });
});
