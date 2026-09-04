import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
  auditImportedManifest,
  deriveReportWithImportedAudit,
} from '@/lib/imported-manifest';
import { runPublicSourceScan } from '@/lib/integrations/public-scan';
import {
  summarizeReport,
  type IntegrationReportSummary,
} from '@/lib/integrations/report-summary';
import { AUDIT_WIDGET_URI, auditWidgetHtml } from '@/lib/mcp/audit-widget';
import { toScanError } from '@/lib/network';
import { makeDemoReport } from '@/lib/scanner';
import { allowRequest, getReport, putReport } from '@/lib/scan-store';

const findingSchema = z.object({
  title: z.string(),
  status: z.string(),
  severity: z.string(),
  recommendation: z.string(),
});
const actionSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  risk: z.string(),
  agentUiConfidence: z.string(),
  webmcpStatus: z.string(),
});
const recommendationSchema = z.object({
  priority: z.enum(['P0', 'P1', 'P2']),
  title: z.string(),
  detail: z.string(),
});
const countsSchema = z.object({
  forms: z.number(),
  inputs: z.number(),
  buttons: z.number(),
  links: z.number(),
  selects: z.number(),
  textareas: z.number(),
  labels: z.number(),
  structuredData: z.number(),
  headings: z.number(),
});

const reportSummaryOutputShape = {
  reportId: z.string(),
  reportKind: z.enum(['observed_source', 'synthetic_fixture']),
  url: z.string(),
  scannedAt: z.string(),
  evidenceScope: z.enum(['source-only', 'synthetic-fixture']),
  implementationState: z.enum([
    'not_detected',
    'source_hint_detected',
    'runtime_verified',
    'journey_tested',
    'improvement_proven',
  ]),
  collection: z.object({
    status: z.enum(['complete', 'partial']),
    analyzedBytes: z.number(),
    declaredBytes: z.number().nullable(),
    truncated: z.boolean(),
  }),
  actionability: z.object({
    value: z.number().nullable(),
    coverage: z.number(),
    confidence: z.string(),
    interval: z.object({ lower: z.number(), upper: z.number() }).nullable(),
  }),
  counts: countsSchema,
  actions: z.array(actionSchema),
  findings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  limitations: z.array(z.string()),
  labels: z.object({
    runtime: z.literal('unknown'),
    lift: z.literal('withheld'),
    contract: z.enum(['not-provided', 'imported-not-independently-verified']),
  }),
};

const contractToolSchema = z
  .object({
    name: z.string().trim().min(1).max(256),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().min(1).max(5_000),
    inputSchema: z.record(z.string(), z.unknown()).optional(),
    outputSchema: z.record(z.string(), z.unknown()).optional(),
    annotations: z
      .object({
        readOnlyHint: z.boolean().optional(),
        untrustedContentHint: z.boolean().optional(),
      })
      .strict()
      .optional(),
    stateEffects: z.string().trim().max(1_000).optional(),
    verification: z.string().trim().max(1_000).optional(),
    confirmation: z.string().trim().max(1_000).optional(),
    errorCodes: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  })
  .strict();

function reportResult(summary: IntegrationReportSummary, message: string) {
  return {
    structuredContent: summary,
    content: [{ type: 'text' as const, text: message }],
  };
}

function failureResult(error: unknown) {
  const normalized = toScanError(error);
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: `${normalized.body.error.code}: ${normalized.body.error.message}`,
      },
    ],
  };
}

export function createIsWebMcpServer(requesterKey = 'anonymous') {
  const server = new McpServer({
    name: 'isWebMCP',
    version: '1.0.0',
    websiteUrl: 'https://iswebmcp.com',
  });

  server.registerResource(
    'iswebmcp-audit-widget',
    AUDIT_WIDGET_URI,
    {
      title: 'isWebMCP evidence report',
      description:
        'Renders an evidence-scoped WebMCP opportunity and readiness report.',
      mimeType: 'text/html;profile=mcp-app',
    },
    async () => ({
      contents: [
        {
          uri: AUDIT_WIDGET_URI,
          mimeType: 'text/html;profile=mcp-app',
          text: auditWidgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              domain: 'https://iswebmcp.com',
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
            'openai/widgetDescription':
              'An isWebMCP evidence report that distinguishes source observations, imported contracts, runtime proof, and measured lift.',
            'openai/widgetPrefersBorder': true,
            'openai/widgetDomain': 'https://iswebmcp.com',
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [],
              redirect_domains: ['https://iswebmcp.com'],
            },
          },
        },
      ],
    }),
  );

  server.registerTool(
    'audit_public_url',
    {
      title: 'Audit a public web page',
      description:
        'Use this when the user wants to map a public page’s agent-action opportunity from bounded source evidence. This does not execute target JavaScript or prove runtime readiness.',
      inputSchema: {
        url: z.string().trim().min(1).max(2_048),
        goal: z.string().trim().max(300).optional(),
      },
      outputSchema: reportSummaryOutputShape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: AUDIT_WIDGET_URI },
        'openai/outputTemplate': AUDIT_WIDGET_URI,
        'openai/toolInvocation/invoking': 'Mapping the public action surface…',
        'openai/toolInvocation/invoked': 'Source evidence mapped',
      },
    },
    async ({ url, goal }) => {
      if (!allowRequest(`mcp:${requesterKey}`, 12)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'RATE_LIMITED: Too many audits from this client. Try again in a minute.',
            },
          ],
        };
      }
      try {
        const report = await runPublicSourceScan({
          url,
          goal,
          redirectRateLimitPrefix: 'mcp-host',
          surface: 'mcp',
        });
        return reportResult(
          summarizeReport(report),
          `Mapped bounded public source for ${report.finalUrl}. Runtime readiness remains unknown because no agent trial was observed.`,
        );
      } catch (error) {
        return failureResult(error);
      }
    },
  );

  server.registerTool(
    'show_sample_audit',
    {
      title: 'Show a synthetic sample audit',
      description:
        'Use this when the user wants to understand an isWebMCP report before scanning a real public URL. The result is a labeled synthetic fixture.',
      inputSchema: {},
      outputSchema: reportSummaryOutputShape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: AUDIT_WIDGET_URI },
        'openai/outputTemplate': AUDIT_WIDGET_URI,
        'openai/toolInvocation/invoking': 'Preparing the sample evidence…',
        'openai/toolInvocation/invoked': 'Sample evidence ready',
      },
    },
    async () => {
      const report = makeDemoReport();
      putReport(report);
      return reportResult(
        summarizeReport(report),
        'Opened a synthetic sample report. It teaches the evidence model and is not an observation of a third-party website.',
      );
    },
  );

  server.registerTool(
    'audit_tool_contracts',
    {
      title: 'Audit sanitized WebMCP contracts',
      description:
        'Use this after audit_public_url when the user supplies sanitized WebMCP tool definitions for the same page. Imported definitions are linted but are not independently verified runtime evidence.',
      inputSchema: {
        scanId: z
          .string()
          .trim()
          .regex(/^scan_[a-z0-9]{12}$/),
        tools: z.array(contractToolSchema).min(1).max(50),
      },
      outputSchema: reportSummaryOutputShape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: AUDIT_WIDGET_URI },
        'openai/outputTemplate': AUDIT_WIDGET_URI,
        'openai/toolInvocation/invoking': 'Auditing the imported contracts…',
        'openai/toolInvocation/invoked': 'Contract audit ready',
      },
    },
    async ({ scanId, tools }) => {
      const base = getReport(scanId);
      if (!base) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'REPORT_UNAVAILABLE: The source report expired or is unavailable. Run audit_public_url again, then retry the contract audit.',
            },
          ],
        };
      }
      try {
        const audit = auditImportedManifest(
          {
            scanId,
            manifest: {
              format: 'iswebmcp-tool-manifest/v1',
              captureMethod: 'manual',
              tools,
            },
          },
          base,
        );
        const report = deriveReportWithImportedAudit(base, audit);
        putReport(report);
        return reportResult(
          summarizeReport(report),
          `Audited ${tools.length} sanitized tool definition${tools.length === 1 ? '' : 's'}. The contract evidence is imported and not independently verified.`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'INVALID_MANIFEST';
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `${message}: Remove credential-like data, unsafe schema structure, or unsupported fields before retrying.`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    'explain_evidence_level',
    {
      title: 'Explain a readiness evidence level',
      description:
        'Use this when the user asks what source actionability, contract lint, runtime readiness, or measured WebMCP lift means.',
      inputSchema: {
        level: z.enum(['source', 'contract', 'runtime', 'lift']),
      },
      outputSchema: {
        level: z.enum(['source', 'contract', 'runtime', 'lift']),
        explanation: z.string(),
        requirement: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ level }) => {
      const evidence = {
        source: {
          explanation:
            'Source Actionability describes controls and candidate actions observed in bounded public HTML.',
          requirement: 'A successful bounded public-source fetch.',
        },
        contract: {
          explanation:
            'Contract Lint reviews sanitized imported tool definitions for clarity, safety, and verifiability.',
          requirement:
            'A sanitized tool inventory; provenance remains imported and not independently verified.',
        },
        runtime: {
          explanation:
            'Runtime Readiness describes an observed agent trial, including selection, execution, safety, and postcondition verification.',
          requirement:
            'A controlled runtime trial with environment, trace, and result evidence.',
        },
        lift: {
          explanation:
            'Measured WebMCP Lift compares UI-only and tool-based paths without hiding the raw components.',
          requirement:
            'Paired interactive runs of the same task, fixture, starting state, and success criteria.',
        },
      } as const;
      const result = { level, ...evidence[level] };
      return {
        structuredContent: result,
        content: [{ type: 'text', text: result.explanation }],
      };
    },
  );

  return server;
}
