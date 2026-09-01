import { z } from 'zod';

import { calculateWeightedScore } from '@/lib/scoring';
import type {
  Evidence,
  Finding,
  ImportedManifestAudit,
  ImportedSchemaSummary,
  ImportedToolDefinition,
  ScanReport,
  ScoreCategory,
} from '@/lib/types';

const MAX_SCHEMA_DEPTH = 12;
const MAX_SCHEMA_NODES = 2_000;
const objectSchema = z.custom<Record<string, unknown>>(
  (value) =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value),
  'Expected a JSON object.',
);
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const sensitivePattern =
  /(password|secret|token|credential|ssn|social_security|medical_history|browsing_history|ethnicity|religion|political)/i;
const actionVerbPattern =
  /^(?:add|book|compare|create|delete|download|export|fetch|filter|find|get|list|load|pay|purchase|read|remove|reserve|save|search|send|submit|update|upload|validate|verify)\b/i;
const actionVerbs = new Set([
  'add',
  'book',
  'compare',
  'create',
  'delete',
  'download',
  'export',
  'fetch',
  'filter',
  'find',
  'get',
  'list',
  'load',
  'pay',
  'purchase',
  'read',
  'remove',
  'reserve',
  'save',
  'search',
  'send',
  'submit',
  'update',
  'upload',
  'validate',
  'verify',
]);
const mutationPattern =
  /(?:^|[_.-])(?:add|book|create|delete|pay|purchase|remove|reserve|save|send|submit|update|upload)(?:$|[_.-])/i;

const toolSchema = z
  .object({
    name: z.string().trim().min(1).max(256),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().min(1).max(5_000),
    inputSchema: objectSchema.optional(),
    outputSchema: objectSchema.optional(),
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

const manifestEnvelopeSchema = z
  .object({
    format: z.literal('iswebmcp-tool-manifest/v1').optional(),
    pageUrl: z.string().trim().max(2_048).optional(),
    capturedAt: z.string().trim().max(80).optional(),
    captureMethod: z.enum(['manual', 'same_origin_probe']).optional(),
    tools: z.array(toolSchema).min(1).max(50),
  })
  .strict();

export const importedManifestRequestSchema = z
  .object({
    scanId: z
      .string()
      .trim()
      .regex(/^scan_[a-z0-9]{12}$/),
    manifest: z.union([
      z.array(toolSchema).min(1).max(50),
      manifestEnvelopeSchema,
    ]),
  })
  .strict();

export type ImportedManifestRequest = z.infer<
  typeof importedManifestRequestSchema
>;

function cleanText(
  value: string | undefined,
  maximum: number,
): string | undefined {
  if (!value) return undefined;
  const printable = Array.from(value, (character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 8 ||
      (code >= 11 && code <= 12) ||
      (code >= 14 && code <= 31) ||
      code === 127
      ? ' '
      : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, maximum);
}

interface StructureStats {
  depth: number;
  nodeCount: number;
}

function assertSafeStructure(value: unknown): StructureStats {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let depth = 0;
  let nodeCount = 0;
  while (stack.length) {
    const current = stack.pop() as { value: unknown; depth: number };
    depth = Math.max(depth, current.depth);
    nodeCount += 1;
    if (depth > MAX_SCHEMA_DEPTH || nodeCount > MAX_SCHEMA_NODES)
      throw new Error('UNSAFE_SCHEMA');
    if (typeof current.value === 'string') {
      if (
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~-]{16,}|\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/i.test(
          current.value,
        )
      ) {
        throw new Error('CREDENTIAL_LIKE_DATA');
      }
      continue;
    }
    if (Array.isArray(current.value)) {
      for (const child of current.value)
        stack.push({ value: child, depth: current.depth + 1 });
      continue;
    }
    if (!current.value || typeof current.value !== 'object') continue;
    for (const [key, child] of Object.entries(
      current.value as Record<string, unknown>,
    )) {
      if (forbiddenKeys.has(key)) throw new Error('UNSAFE_SCHEMA');
      stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return { depth, nodeCount };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function summarizeSchema(
  value: Record<string, unknown> | undefined,
): ImportedSchemaSummary {
  if (!value) {
    return {
      present: false,
      propertiesObject: false,
      closed: false,
      propertyNames: [],
      required: [],
      requiredIsValidSubset: false,
      typedPropertyCount: 0,
      constrainedPropertyCount: 0,
      sensitivePropertyNames: [],
      depth: 0,
      nodeCount: 0,
    };
  }
  const structure = assertSafeStructure(value);
  const properties = isPlainRecord(value.properties) ? value.properties : null;
  const propertyNames: string[] = [];
  let typedPropertyCount = 0;
  let constrainedPropertyCount = 0;
  if (properties) {
    const stack = [properties];
    while (stack.length) {
      const current = stack.pop() as Record<string, unknown>;
      for (const [name, definition] of Object.entries(current)) {
        propertyNames.push(name.slice(0, 160));
        if (!isPlainRecord(definition)) continue;
        if (
          typeof definition.type === 'string' ||
          Array.isArray(definition.type) ||
          Array.isArray(definition.enum) ||
          Array.isArray(definition.anyOf) ||
          Array.isArray(definition.oneOf) ||
          Array.isArray(definition.allOf)
        )
          typedPropertyCount += 1;
        if (
          [
            'minLength',
            'maxLength',
            'minItems',
            'maxItems',
            'uniqueItems',
            'minimum',
            'maximum',
            'pattern',
            'format',
            'description',
            'enum',
          ].some((key) => key in definition)
        )
          constrainedPropertyCount += 1;
        if (isPlainRecord(definition.properties))
          stack.push(definition.properties);
        if (
          isPlainRecord(definition.items) &&
          isPlainRecord(definition.items.properties)
        ) {
          stack.push(definition.items.properties);
        }
      }
    }
  }
  const required = Array.isArray(value.required)
    ? [
        ...new Set(
          value.required.filter(
            (item): item is string => typeof item === 'string',
          ),
        ),
      ].slice(0, 100)
    : [];
  const rootPropertyNames = new Set(properties ? Object.keys(properties) : []);
  return {
    present: true,
    rootType:
      typeof value.type === 'string' ? value.type.slice(0, 40) : undefined,
    propertiesObject: Boolean(properties),
    closed: value.additionalProperties === false,
    propertyNames: [...new Set(propertyNames)].slice(0, 200),
    required,
    requiredIsValidSubset:
      Boolean(properties) &&
      required.every((item) => rootPropertyNames.has(item)),
    typedPropertyCount,
    constrainedPropertyCount,
    sensitivePropertyNames: [
      ...new Set(propertyNames.filter((name) => sensitivePattern.test(name))),
    ],
    ...structure,
  };
}

function normalizedWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function actionMatches(
  tool: Pick<ImportedToolDefinition, 'name' | 'title' | 'description'>,
  actionName: string,
): boolean {
  const identityWords = new Set(
    normalizedWords(`${tool.name} ${tool.title ?? ''}`),
  );
  const actionWords = normalizedWords(actionName);
  const actionVerb = actionWords.find((word) => actionVerbs.has(word));
  // Coverage is an exact contract-identity signal. Descriptions can explain a
  // tool, but listing many verbs in prose must not manufacture action coverage.
  if (actionVerb) return identityWords.has(actionVerb);
  return (
    actionWords.length > 0 &&
    actionWords.every((word) => identityWords.has(word))
  );
}

function average(values: number[]): number {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

function category(
  id: string,
  label: string,
  weight: number,
  score: number | null,
  explanation: string,
): ScoreCategory {
  return {
    id,
    label,
    weight,
    score,
    status:
      score === null
        ? 'not_observed'
        : score >= 80
          ? 'pass'
          : score >= 50
            ? 'partial'
            : 'fail',
    explanation,
  };
}

function schemaScore(schema: ImportedSchemaSummary): number {
  if (!schema.present) return 0;
  const propertyCount = schema.propertyNames.length;
  return (
    (schema.rootType === 'object' ? 25 : 0) +
    (schema.propertiesObject ? 15 : 0) +
    (schema.closed ? 20 : 0) +
    (schema.requiredIsValidSubset ? 15 : 0) +
    (schema.propertiesObject &&
    (propertyCount === 0 || schema.typedPropertyCount === propertyCount)
      ? 15
      : 0) +
    (schema.propertiesObject &&
    (propertyCount === 0 || schema.constrainedPropertyCount === propertyCount)
      ? 5
      : 0) +
    (schema.sensitivePropertyNames.length === 0 ? 5 : 0)
  );
}

function readManifest(
  input: ImportedManifestRequest,
  report: ScanReport,
  now: Date,
): {
  rawTools: z.infer<typeof toolSchema>[];
  captureMethod: 'manual' | 'same_origin_probe';
  capturedAt?: string;
  targetOrigin: string;
  warnings: string[];
} {
  const envelope = Array.isArray(input.manifest) ? null : input.manifest;
  const rawTools = Array.isArray(input.manifest)
    ? input.manifest
    : input.manifest.tools;
  const captureMethod = envelope?.captureMethod ?? 'manual';
  const targetOrigin = new URL(report.finalUrl).origin;
  const warnings: string[] = [];

  if (
    captureMethod === 'same_origin_probe' &&
    (envelope?.format !== 'iswebmcp-tool-manifest/v1' ||
      !envelope.pageUrl ||
      !envelope.capturedAt)
  ) {
    throw new Error('INVALID_PROVENANCE');
  }
  if (envelope?.pageUrl) {
    let pageUrl: URL;
    try {
      pageUrl = new URL(envelope.pageUrl);
    } catch {
      throw new Error('INVALID_PROVENANCE');
    }
    if (
      !['http:', 'https:'].includes(pageUrl.protocol) ||
      pageUrl.username ||
      pageUrl.password ||
      pageUrl.origin !== targetOrigin
    ) {
      throw new Error('ORIGIN_MISMATCH');
    }
  }
  let capturedAt: string | undefined;
  if (envelope?.capturedAt) {
    const timestamp = Date.parse(envelope.capturedAt);
    if (!Number.isFinite(timestamp)) throw new Error('INVALID_PROVENANCE');
    if (timestamp > now.getTime() + 5 * 60_000)
      throw new Error('INVALID_PROVENANCE');
    capturedAt = new Date(timestamp).toISOString();
    if (timestamp < now.getTime() - 24 * 60 * 60_000)
      warnings.push('The supplied capture is more than 24 hours old.');
  }
  if (captureMethod === 'manual')
    warnings.push(
      'The inventory was attached manually and its target origin was not independently verified.',
    );
  return { rawTools, captureMethod, capturedAt, targetOrigin, warnings };
}

export function auditImportedManifest(
  input: ImportedManifestRequest,
  report: ScanReport,
  now = new Date(),
): ImportedManifestAudit {
  if (input.scanId !== report.id) throw new Error('INVALID_PROVENANCE');
  assertSafeStructure(input.manifest);
  const importedAt = now.toISOString();
  const provenance = readManifest(input, report, now);
  const normalizedNameCounts = new Map<string, number>();
  provenance.rawTools.forEach((tool) => {
    const normalized = tool.name.toLowerCase();
    normalizedNameCounts.set(
      normalized,
      (normalizedNameCounts.get(normalized) ?? 0) + 1,
    );
  });

  const tools: ImportedToolDefinition[] = provenance.rawTools.map((tool) => {
    const name = cleanText(tool.name, 256) as string;
    const title = cleanText(tool.title, 300);
    const description = cleanText(tool.description, 5_000) as string;
    const summary: ImportedToolDefinition = {
      name,
      title,
      description,
      originalDescriptionLength: tool.description.length,
      inputSchema: summarizeSchema(tool.inputSchema),
      outputSchema: summarizeSchema(tool.outputSchema),
      annotations: tool.annotations ? { ...tool.annotations } : undefined,
      declaresStateEffects: Boolean(tool.stateEffects),
      declaresVerification: Boolean(tool.verification),
      declaresConfirmation: Boolean(tool.confirmation),
      declaredErrorCodeCount: new Set(tool.errorCodes ?? []).size,
      matchedActionIds: [],
    };
    summary.matchedActionIds = report.actionSurface
      .filter((action) => actionMatches(summary, action.name))
      .map((action) => action.id);
    return summary;
  });

  const matchedActionIds = [
    ...new Set(tools.flatMap((tool) => tool.matchedActionIds)),
  ];
  const actionCoverage = report.actionSurface.length
    ? Math.round((matchedActionIds.length / report.actionSurface.length) * 100)
    : null;
  const naming = average(
    tools.map((tool) => {
      const descriptionWords = normalizedWords(tool.description);
      const normalizedName = tool.name.toLowerCase();
      return (
        (/^[A-Za-z0-9_.-]{1,128}$/.test(tool.name) ? 25 : 0) +
        (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(tool.name) &&
        tool.name.length <= 30
          ? 10
          : 0) +
        (tool.description.length >= 20 && tool.description.length <= 500
          ? 25
          : tool.description.length
            ? 8
            : 0) +
        (actionVerbPattern.test(tool.description) ? 15 : 0) +
        (descriptionWords.length >= 4 &&
        tool.description.toLowerCase() !==
          `${tool.title ?? tool.name}`.toLowerCase()
          ? 15
          : 0) +
        (normalizedNameCounts.get(normalizedName) === 1 ? 10 : 0)
      );
    }),
  );
  const schemas = average(tools.map((tool) => schemaScore(tool.inputSchema)));
  const safety = average(
    tools.map((tool) => {
      const mutating = mutationPattern.test(tool.name);
      const readOnly = tool.annotations?.readOnlyHint;
      const annotationPoints = readOnly !== undefined ? 25 : 0;
      const agreementPoints =
        readOnly !== undefined && readOnly !== mutating ? 25 : 0;
      const untrustedPoints =
        tool.annotations?.untrustedContentHint === true ? 15 : 0;
      const boundaryPoints =
        readOnly === true ||
        (readOnly === false &&
          (tool.declaresConfirmation || tool.declaresStateEffects))
          ? 15
          : 0;
      const sensitivePenalty = tool.inputSchema.sensitivePropertyNames.length
        ? 35
        : 0;
      return Math.max(
        0,
        annotationPoints +
          agreementPoints +
          untrustedPoints +
          boundaryPoints -
          sensitivePenalty,
      );
    }),
  );

  const categories = [
    category(
      'action_coverage',
      'Useful action coverage',
      20,
      actionCoverage,
      actionCoverage === null
        ? 'No source action surface was available for exact-token matching.'
        : `${matchedActionIds.length} of ${report.actionSurface.length} source action candidates matched imported name, title, or description tokens.`,
    ),
    category(
      'contracts',
      'Tool naming and descriptions',
      15,
      naming,
      'Checks draft name syntax plus concise, action-led, task-specific descriptions and duplicate names.',
    ),
    category(
      'schemas',
      'Input schemas and validation',
      15,
      schemas,
      'Checks closed object schemas, valid required fields, typed and constrained properties, and sensitive parameter names.',
    ),
    category(
      'outputs',
      'Outputs and result verifiability',
      15,
      null,
      'Declared output metadata is inventoried but cannot prove returned postconditions or visible result verification.',
    ),
    category(
      'state',
      'State consistency and UI synchronization',
      15,
      null,
      'Imported declarations cannot prove that execution and visible UI state remain synchronized.',
    ),
    category(
      'safety',
      'Safety, permissions, and confirmation',
      15,
      safety,
      'Declaration-level annotations and mutation boundaries were assessed; runtime authorization remains unobserved.',
    ),
    category(
      'errors',
      'Error behavior and recovery',
      5,
      null,
      'Declared error codes are inventoried but cannot prove browser-visible rejection behavior or recovery.',
    ),
  ];
  const quality = calculateWeightedScore(categories);
  const evidence: Evidence[] = [
    {
      id: 'import-provenance',
      source: 'imported',
      category: 'provenance',
      summary: `${tools.length} tool contract${tools.length === 1 ? '' : 's'} imported with ${provenance.captureMethod} provenance`,
      detail: `Bound to report ${report.id} for ${provenance.targetOrigin}; capture method: ${provenance.captureMethod}. This is not independent runtime verification.`,
      confidence: 'medium',
      observedAt: importedAt,
    },
    ...tools.map(
      (tool, index): Evidence => ({
        id: `import-tool-${index + 1}`,
        source: 'imported',
        category: 'tool_contract',
        summary: `Imported contract: ${tool.name}`,
        detail: `${tool.description} Input schema: ${tool.inputSchema.present ? `${tool.inputSchema.propertyNames.length} summarized properties` : 'not supplied'}.`,
        confidence: 'medium',
        observedAt: importedAt,
      }),
    ),
    ...categories.map(
      (item): Evidence => ({
        id: `import-${item.id}`,
        source: 'imported',
        category: item.id,
        summary: `${item.label}: ${item.score ?? 'not observed'}`,
        detail: item.explanation,
        confidence: 'medium',
        observedAt: importedAt,
      }),
    ),
    ...report.actionSurface
      .filter((action) => matchedActionIds.includes(action.id))
      .map(
        (action): Evidence => ({
          id: `import-map-${action.id}`,
          source: 'inferred',
          category: 'action_mapping',
          summary: `Imported contract token-matched “${action.name}”`,
          detail:
            'This lexical mapping is inferred from imported text and does not prove tool selection or execution.',
          confidence: 'low',
          observedAt: importedAt,
        }),
      ),
  ];
  const findings: Finding[] = categories
    .filter((item) => item.score === null || item.score < 80)
    .map((item) => {
      const score = item.score;
      const unavailableAtImport = score === null;
      const severeObservedGap =
        score !== null && score < 50 && item.weight >= 15;
      return {
        id: `finding-import-${item.id}`,
        ruleId: `IMPORTED_${item.id.toUpperCase()}`,
        title: unavailableAtImport
          ? `${item.label}: not observed`
          : `${item.label} needs stronger contract evidence`,
        status: unavailableAtImport
          ? 'not_observed'
          : score < 50
            ? 'fail'
            : 'partial',
        severity: unavailableAtImport
          ? 'info'
          : severeObservedGap
            ? 'high'
            : 'medium',
        evidenceIds: [`import-${item.id}`],
        whyItMatters: item.explanation,
        recommendation: unavailableAtImport
          ? `Exercise the implementation in a supported browser to observe ${item.label.toLowerCase()}.`
          : `Tighten the declared ${item.label.toLowerCase()} contract and re-import a sanitized inventory.`,
        priority: unavailableAtImport ? 'P1' : severeObservedGap ? 'P0' : 'P1',
      };
    });

  return {
    id: `import_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    source: 'imported',
    evidenceMode: 'imported',
    independentlyVerified: false,
    format: 'iswebmcp-tool-manifest/v1',
    captureMethod: provenance.captureMethod,
    sourceReportId: report.id,
    targetOrigin: provenance.targetOrigin,
    capturedAt: provenance.capturedAt,
    importedAt,
    tools,
    quality,
    evidence,
    findings,
    matchedActionIds,
    limitations: [
      'Imported definitions were supplied by the user and were not independently observed in a browser.',
      'This contract audit cannot prove registration, authorization, execution, outputs, recovery, or visible state synchronization.',
      'Only bounded schema summaries are retained; raw schema values, examples, defaults, enum values, and executable content are discarded.',
      ...provenance.warnings,
    ],
  };
}

export function deriveReportWithImportedAudit(
  base: ScanReport,
  audit: ImportedManifestAudit,
): ScanReport {
  const priorLimitations = new Set(base.importedProof?.limitations ?? []);
  const findings = [
    ...base.findings.filter((item) => !item.ruleId.startsWith('IMPORTED_')),
    ...audit.findings,
  ];
  return {
    ...base,
    id: `scan_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    parentReportId: base.parentReportId ?? base.id,
    webmcpQuality: audit.quality,
    webmcpLift: null,
    importedProof: audit,
    evidence: [
      ...base.evidence.filter((item) => !item.id.startsWith('import-')),
      ...audit.evidence,
    ],
    findings,
    actionSurface: base.actionSurface.map((action) => {
      const imported = audit.matchedActionIds.includes(action.id);
      return {
        ...action,
        webmcpStatus: imported
          ? 'imported'
          : action.webmcpStatus === 'imported'
            ? 'unknown'
            : action.webmcpStatus,
        sourceEvidenceIds: imported
          ? [
              ...new Set([
                ...action.sourceEvidenceIds.filter(
                  (id) => !id.startsWith('import-'),
                ),
                `import-map-${action.id}`,
              ]),
            ]
          : action.sourceEvidenceIds.filter((id) => !id.startsWith('import-')),
      };
    }),
    limitations: [
      ...base.limitations.filter((item) => !priorLimitations.has(item)),
      ...audit.limitations,
    ],
    strongestEvidence: [
      `${audit.tools.length} imported tool contract${audit.tools.length === 1 ? '' : 's'} audited`,
      ...base.strongestEvidence.filter(
        (item) => !/imported tool contract/i.test(item),
      ),
    ].slice(0, 3),
    recommendations: findings
      .filter(
        (finding) =>
          finding.status !== 'pass' && finding.status !== 'not_applicable',
      )
      .sort(
        (left, right) =>
          ['P0', 'P1', 'P2'].indexOf(left.priority) -
          ['P0', 'P1', 'P2'].indexOf(right.priority),
      )
      .slice(0, 5)
      .map((finding) => ({
        priority: finding.priority,
        title: finding.title,
        detail: finding.recommendation,
      })),
  };
}
