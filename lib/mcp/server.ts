import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
  adoptionReports,
  getAdoptionReport,
  latestAdoptionReport,
} from '@/lib/adoption';
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
import { registerWorkflowTools } from '@/lib/mcp/workflow-tools';
import { toScanError } from '@/lib/network';
import { makeDemoReport } from '@/lib/scanner';
import { allowRequest, getReport, putReport } from '@/lib/scan-store';

const findingSchema = z.object({
  ruleId: z.string(),
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
  summarySchemaVersion: z.literal('iswebmcp-summary/v2'),
  comparisonContext: z
    .object({
      version: z.literal('source-input/v1'),
      fingerprint: z.string(),
    })
    .nullable(),
  findingsCoverage: z.object({
    status: z.literal('complete'),
    total: z.number(),
    returned: z.number(),
  }),
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
    modelVersion: z.string().nullable(),
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
    version: '1.1.0',
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
        openWorldHint: true,
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
    'get_adoption_report',
    {
      title: 'Get a WebMCP adoption report',
      description:
        'Use this when the user asks who has implemented WebMCP, how they implemented it, which tools are exposed, or how strong the evidence is.',
      inputSchema: {
        date: z
          .enum(
            adoptionReports.map((report) => report.date) as [
              string,
              ...string[],
            ],
          )
          .optional(),
      },
      outputSchema: {
        date: z.string(),
        generatedAt: z.string(),
        title: z.string(),
        dek: z.string(),
        changeSummary: z.string(),
        summary: z.record(z.string(), z.number()),
        analysis: z.array(z.object({ heading: z.string(), body: z.string() })),
        organizations: z.array(
          z.object({
            organization: z.string(),
            evidenceLevel: z.string(),
            attribution: z.string(),
            surface: z.string(),
            surfaceStatus: z.string(),
            deploymentCount: z.number(),
            tools: z.array(z.string()),
            limitations: z.array(z.string()),
          }),
        ),
        census: z
          .object({
            scope: z.literal('tranco-top-10000'),
            generatedAt: z.string(),
            source: z.object({
              name: z.literal('Tranco'),
              listId: z.string(),
              listUrl: z.string(),
              listDate: z.string(),
              description: z.string(),
            }),
            scheduledCount: z.number(),
            attemptedCount: z.number(),
            detectedCount: z.number(),
            notDetectedCount: z.number(),
            robotsBlockedCount: z.number(),
            unreachableCount: z.number(),
            unsupportedCount: z.number(),
            documentSurfaceCount: z.number(),
            navigatorSurfaceCount: z.number(),
            bridgeSurfaceCount: z.number(),
            namedToolDefinitions: z.number(),
            auditDigest: z.string(),
            dataUrl: z.string(),
            detections: z.array(
              z.object({
                popularityRank: z.number(),
                domain: z.string(),
                url: z.string(),
                finalUrl: z.string().optional(),
                state: z.literal('detected'),
                surface: z.enum([
                  'document',
                  'navigator',
                  'bridge',
                  'mixed',
                  'unknown',
                ]),
                signals: z.array(z.string()),
                tools: z.array(z.string()),
                checkedAt: z.string(),
                bytesRead: z.number().optional(),
                redirects: z.number().optional(),
              }),
            ),
          })
          .optional(),
        url: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ date }) => {
      const report = date ? getAdoptionReport(date) : latestAdoptionReport;
      if (!report) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `REPORT_NOT_FOUND: No adoption report is published for ${date}.`,
            },
          ],
        };
      }
      const result = {
        date: report.date,
        generatedAt: report.generatedAt,
        title: report.title,
        dek: report.dek,
        changeSummary: report.changeSummary,
        summary: report.summary,
        analysis: report.analysis,
        organizations: report.findings.map((finding) => ({
          organization: finding.organization,
          evidenceLevel: finding.evidenceLevel,
          attribution: finding.attribution,
          surface: finding.surface,
          surfaceStatus: finding.surfaceStatus,
          deploymentCount: finding.deploymentCount,
          tools: finding.tools.map((tool) => tool.name),
          limitations: finding.limitations,
        })),
        census: report.census
          ? {
              scope: report.census.scope,
              generatedAt: report.census.generatedAt,
              source: report.census.source,
              scheduledCount: report.census.scheduledCount,
              attemptedCount: report.census.attemptedCount,
              detectedCount: report.census.detectedCount,
              notDetectedCount: report.census.notDetectedCount,
              robotsBlockedCount: report.census.robotsBlockedCount,
              unreachableCount: report.census.unreachableCount,
              unsupportedCount: report.census.unsupportedCount,
              documentSurfaceCount: report.census.documentSurfaceCount,
              navigatorSurfaceCount: report.census.navigatorSurfaceCount,
              bridgeSurfaceCount: report.census.bridgeSurfaceCount,
              namedToolDefinitions: report.census.namedToolDefinitions,
              auditDigest: report.census.auditDigest,
              dataUrl: `https://iswebmcp.com${report.census.dataUrl}`,
              detections: report.census.detections,
            }
          : undefined,
        url: `https://iswebmcp.com/adoption/${report.date}`,
      };
      return {
        structuredContent: result,
        content: [
          {
            type: 'text',
            text: `${report.title}: ${report.summary.providerEngineeredDeployments} provider-engineered deployments and ${report.summary.platformInheritedDeployments} platform-inherited deployments in the linked external census. Preserve the report's evidence and attribution labels when citing it.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'list_adoption_implementers',
    {
      title: 'List WebMCP implementers',
      description:
        'Search the latest WebMCP adoption ledger by organization or tool, with evidence and API-surface filters.',
      inputSchema: {
        query: z.string().trim().max(120).optional(),
        evidence: z
          .enum([
            'runtime-verified',
            'source-confirmed',
            'third-party-observed',
            'announced',
          ])
          .optional(),
        surfaceStatus: z
          .enum(['current', 'legacy', 'mixed', 'unknown'])
          .optional(),
        limit: z.number().int().min(1).max(20).default(20),
      },
      outputSchema: {
        reportDate: z.string(),
        count: z.number(),
        results: z.array(
          z.object({
            organization: z.string(),
            category: z.string(),
            implementation: z.string(),
            evidenceLevel: z.string(),
            attribution: z.string(),
            surface: z.string(),
            surfaceStatus: z.string(),
            deploymentCount: z.number(),
            tools: z.array(
              z.object({
                name: z.string(),
                purpose: z.string(),
                kind: z.string(),
                status: z.string(),
              }),
            ),
            limitations: z.array(z.string()),
            reportUrl: z.string(),
          }),
        ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, evidence, surfaceStatus, limit }) => {
      const normalized = query?.toLowerCase();
      const results = latestAdoptionReport.findings
        .filter((finding) => {
          if (evidence && finding.evidenceLevel !== evidence) return false;
          if (surfaceStatus && finding.surfaceStatus !== surfaceStatus)
            return false;
          if (!normalized) return true;
          return [
            finding.organization,
            finding.implementation,
            finding.summary,
            ...finding.tools.flatMap((tool) => [tool.name, tool.purpose]),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalized);
        })
        .slice(0, limit)
        .map((finding) => ({
          organization: finding.organization,
          category: finding.category,
          implementation: finding.implementation,
          evidenceLevel: finding.evidenceLevel,
          attribution: finding.attribution,
          surface: finding.surface,
          surfaceStatus: finding.surfaceStatus,
          deploymentCount: finding.deploymentCount,
          tools: finding.tools,
          limitations: finding.limitations,
          reportUrl: `https://iswebmcp.com/adoption/${latestAdoptionReport.date}#${finding.slug}`,
        }));
      const result = {
        reportDate: latestAdoptionReport.date,
        count: results.length,
        results,
      };
      return {
        structuredContent: result,
        content: [
          {
            type: 'text',
            text: `Found ${results.length} matching implementation record${results.length === 1 ? '' : 's'} in the ${latestAdoptionReport.date} report.`,
          },
        ],
      };
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

  registerWorkflowTools(server);
  return server;
}
