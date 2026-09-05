import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  compare,
  validateSummary,
  IsWebMCPError,
} from '../../integrations/developer-kit/index.mjs';
import { implementationRecipes, recipeIds } from './implementation-recipes';

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const findingState = z.object({
  status: z.enum(['pass', 'partial', 'fail', 'not_observed', 'not_applicable']),
  severity: z.enum(['info', 'low', 'medium', 'high', 'blocker']),
});

function parseSummary(json: string) {
  const value: unknown = JSON.parse(json);
  // Bound the work before the shared validator/comparator walks the inventories.
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('INVALID_SUMMARY');
  for (const key of ['findings', 'actions', 'recommendations', 'limitations']) {
    const list = (value as Record<string, unknown>)[key];
    if (!Array.isArray(list) || list.length > 100)
      throw new Error('INVALID_SUMMARY');
  }
  return validateSummary(value);
}

export function registerWorkflowTools(server: McpServer) {
  server.registerTool(
    'get_implementation_recipe',
    {
      title: 'Get a reviewable implementation recipe',
      description:
        'Get a bounded search-tool browser adapter or semantic search-form example after identifying a relevant gap. Returns code and verification steps, never applies a fix. No browser connection or deployment is performed.',
      inputSchema: { recipe: z.enum(recipeIds) },
      outputSchema: {
        id: z.enum(recipeIds),
        title: z.string(),
        evidenceScope: z.literal('implementation-guidance'),
        status: z.literal('review-required'),
        version: z.string(),
        summary: z.string(),
        prerequisites: z.array(z.string()),
        files: z.array(
          z.object({
            path: z.string(),
            language: z.string(),
            code: z.string(),
          }),
        ),
        setup: z.array(z.string()),
        verification: z.array(z.string()),
        limitations: z.array(z.string()),
        sources: z.array(z.string()),
      },
      annotations,
    },
    async ({ recipe }) => {
      const result = implementationRecipes[recipe];
      return {
        structuredContent: result,
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    'compare_source_reports',
    {
      title: 'Compare two saved source summaries',
      description:
        'Compare baseline and current iswebmcp-summary/v2 JSON supplied by the user, using the same rules as the CLI. Requires matching URL, scan fingerprint, model, complete inventories, chronological order, and no imported contracts. Does not fetch, store, authenticate, or execute supplied evidence. Ask before sending sensitive summaries; prefer the local CLI for private evidence. No runtime or ROI claim.',
      inputSchema: {
        baselineJson: z
          .string()
          .min(2)
          .max(96000)
          .describe('Complete baseline summary JSON, not a scan ID or URL.'),
        currentJson: z
          .string()
          .min(2)
          .max(96000)
          .describe('Complete current summary JSON, not a scan ID or URL.'),
      },
      outputSchema: {
        schemaVersion: z.literal('iswebmcp-source-comparison/v2'),
        evidenceScope: z.literal('source-only'),
        inputProvenance: z.literal(
          'user-supplied-not-independently-authenticated',
        ),
        baselineReportId: z.string(),
        currentReportId: z.string(),
        url: z.string(),
        modelVersion: z.string(),
        regressed: z.boolean(),
        regressionCount: z.number().int().nonnegative(),
        changes: z.array(
          z.object({
            ruleId: z.string(),
            title: z.string(),
            before: findingState.nullable(),
            after: findingState,
            regressed: z.boolean(),
            regressionReasons: z.array(
              z.enum(['new-problem', 'status-worsened', 'severity-increased']),
            ),
            recommendation: z.string(),
          }),
        ),
        noLongerReported: z.array(z.string()),
        limitations: z.array(z.string()),
      },
      annotations,
    },
    async ({ baselineJson, currentJson }) => {
      try {
        const comparison = compare(
          parseSummary(baselineJson),
          parseSummary(currentJson),
        );
        const result = {
          ...comparison,
          inputProvenance:
            'user-supplied-not-independently-authenticated' as const,
        };
        return {
          structuredContent: result,
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error) {
        const message =
          error instanceof IsWebMCPError && error.code === 'NOT_COMPARABLE'
            ? error.message
            : 'Invalid or oversized summary. Supply complete source summary/v2 JSON with at most 100 items per inventory. Do not send secrets.';
        return {
          isError: true,
          content: [
            { type: 'text', text: `Comparison inconclusive: ${message}` },
          ],
        };
      }
    },
  );
}
