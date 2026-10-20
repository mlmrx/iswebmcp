export type AgentTraceStepKind =
  | 'agent'
  | 'model'
  | 'search'
  | 'fetch'
  | 'crawl'
  | 'browse'
  | 'tool';

export type AgentTraceStep = {
  id: string;
  kind: AgentTraceStepKind;
  label: string;
  detail: string;
  target?: string;
  statusCode?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type ImportedAgentTrace = {
  agent: string | null;
  model: string | null;
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  steps: AgentTraceStep[];
};

const MAX_TRACE_SPANS = 1_000;
const MAX_TEXT_LENGTH = 120;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  let bounded = '';
  for (const character of value) {
    const code = character.charCodeAt(0);
    bounded += code < 32 || code === 127 ? ' ' : character;
    if (bounded.length >= MAX_TEXT_LENGTH) break;
  }
  return bounded.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
}

function attributeValue(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  for (const key of ['stringValue', 'intValue', 'doubleValue', 'boolValue']) {
    if (key in value) return value[key];
  }
  return undefined;
}

function readAttributes(value: unknown): Map<string, unknown> {
  const result = new Map<string, unknown>();
  if (!Array.isArray(value)) return result;
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== 'string') continue;
    result.set(item.key, attributeValue(item.value));
  }
  return result;
}

function numericAttribute(attributes: Map<string, unknown>, key: string) {
  const value = attributes.get(key);
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

function safeHost(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return `${url.hostname}${url.pathname === '/' ? '' : url.pathname}`.slice(
      0,
      MAX_TEXT_LENGTH,
    );
  } catch {
    return undefined;
  }
}

function getDurationMs(start: unknown, end: unknown): number | undefined {
  if (typeof start !== 'string' || typeof end !== 'string') return undefined;
  const startNanos = Number(start);
  const endNanos = Number(end);
  if (!Number.isFinite(startNanos) || !Number.isFinite(endNanos))
    return undefined;
  const milliseconds = Math.round((endNanos - startNanos) / 1_000_000);
  return Number.isSafeInteger(milliseconds) && milliseconds >= 0
    ? milliseconds
    : undefined;
}

function classifyStep(
  operation: string,
  toolName: string,
  spanName: string,
  method: string,
  url: string | undefined,
): AgentTraceStepKind {
  const text = `${operation} ${toolName} ${spanName} ${method} ${url ?? ''}`
    .toLowerCase()
    .replaceAll('_', ' ');
  if (text.includes('invoke agent') || text.includes('invoke workflow')) {
    return 'agent';
  }
  if (
    operation === 'chat' ||
    operation === 'generate_content' ||
    operation === 'text_completion' ||
    operation === 'embeddings'
  ) {
    return 'model';
  }
  if (/search|query/.test(text)) return 'search';
  if (/crawl|spider|sitemap/.test(text)) return 'crawl';
  if (/browser|navigate|navigation|browse|click|screenshot/.test(text)) {
    return 'browse';
  }
  if (method || url || /fetch|http request/.test(text)) return 'fetch';
  return 'tool';
}

function stepLabel(kind: AgentTraceStepKind) {
  const labels: Record<AgentTraceStepKind, string> = {
    agent: 'Agent run',
    model: 'Model turn',
    search: 'Web search',
    fetch: 'Fetch',
    crawl: 'Crawl',
    browse: 'Browser action',
    tool: 'Tool call',
  };
  return labels[kind];
}

/**
 * Reads an OpenTelemetry OTLP/JSON trace export in the browser. Prompt,
 * completion, tool argument, and tool result attributes are deliberately
 * ignored; only operation names, URLs, status, duration, and usage counts are
 * retained for the visual trace.
 */
export function parseOpenTelemetryTrace(raw: string): ImportedAgentTrace {
  if (raw.length > 5 * 1024 * 1024) {
    throw new Error('Trace files must be 5 MB or smaller.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.resourceSpans)) {
    throw new Error(
      'Choose an OpenTelemetry trace JSON export containing resourceSpans.',
    );
  }

  const rawSpans: Array<{
    span: JsonRecord;
    resourceAttributes: Map<string, unknown>;
  }> = [];
  for (const resourceSpan of parsed.resourceSpans) {
    if (!isRecord(resourceSpan)) continue;
    const resourceAttributes = readAttributes(
      isRecord(resourceSpan.resource)
        ? resourceSpan.resource.attributes
        : undefined,
    );
    if (!Array.isArray(resourceSpan.scopeSpans)) continue;
    for (const scopeSpan of resourceSpan.scopeSpans) {
      if (!isRecord(scopeSpan) || !Array.isArray(scopeSpan.spans)) continue;
      for (const span of scopeSpan.spans) {
        if (!isRecord(span)) continue;
        rawSpans.push({ span, resourceAttributes });
        if (rawSpans.length > MAX_TRACE_SPANS) {
          throw new Error(
            `Trace files can contain up to ${MAX_TRACE_SPANS} spans.`,
          );
        }
      }
    }
  }

  const steps: AgentTraceStep[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  const stepTimes = new Map<string, number>();
  const tokenSpans = new Set<string>();
  let inputTokens = 0;
  let outputTokens = 0;
  let model: string | null = null;
  let agent: string | null = null;

  rawSpans.forEach(({ span, resourceAttributes }, index) => {
    const attributes = readAttributes(span.attributes);
    const operation = cleanText(attributes.get('gen_ai.operation.name'));
    const toolName = cleanText(
      attributes.get('gen_ai.tool.name') ?? attributes.get('tool.name'),
    );
    const spanName = cleanText(span.name);
    const method = cleanText(
      attributes.get('http.request.method'),
    ).toUpperCase();
    const rawUrl =
      attributes.get('url.full') ??
      attributes.get('http.url') ??
      attributes.get('http.target');
    const target = safeHost(rawUrl);
    const statusCode = numericAttribute(
      attributes,
      'http.response.status_code',
    );
    const modelName = cleanText(attributes.get('gen_ai.request.model'));
    const providerName = cleanText(
      attributes.get('gen_ai.provider.name') ??
        resourceAttributes.get('gen_ai.provider.name') ??
        resourceAttributes.get('service.name'),
    );
    if (!model && modelName) model = modelName;
    if (!agent && providerName) agent = providerName;

    const kind = classifyStep(operation, toolName, spanName, method, target);
    const hasTraceSignal =
      Boolean(operation || toolName || method || target) || kind !== 'tool';
    if (!hasTraceSignal) return;

    const start = span.startTimeUnixNano;
    const end = span.endTimeUnixNano;
    if (typeof start === 'string' && Number.isFinite(Number(start))) {
      starts.push(Number(start));
    }
    if (typeof end === 'string' && Number.isFinite(Number(end))) {
      ends.push(Number(end));
    }

    const durationMs = getDurationMs(start, end);
    const spanModel = cleanText(attributes.get('gen_ai.request.model'));
    const isModelCall =
      kind === 'model' ||
      Boolean(spanModel) ||
      ['chat', 'generate_content', 'text_completion'].includes(operation);
    const spanInput = isModelCall
      ? numericAttribute(attributes, 'gen_ai.usage.input_tokens')
      : undefined;
    const spanOutput = isModelCall
      ? numericAttribute(attributes, 'gen_ai.usage.output_tokens')
      : undefined;
    const spanId =
      typeof span.spanId === 'string' ? span.spanId : String(index);
    if (typeof start === 'string' && Number.isFinite(Number(start))) {
      stepTimes.set(spanId, Number(start));
    }
    if (
      !tokenSpans.has(spanId) &&
      (spanInput !== undefined || spanOutput !== undefined)
    ) {
      tokenSpans.add(spanId);
      inputTokens += spanInput ?? 0;
      outputTokens += spanOutput ?? 0;
    }

    const statusText = modelName
      ? `Model turn · ${modelName}`
      : kind === 'tool'
        ? 'Agent tool operation recorded'
        : `${stepLabel(kind)} operation recorded`;
    const detail = target
      ? `${method || 'GET'} ${target}${statusCode !== undefined ? ` · HTTP ${statusCode}` : ''}`
      : statusText;

    steps.push({
      id: spanId,
      kind,
      label: stepLabel(kind),
      detail,
      ...(target ? { target } : {}),
      ...(statusCode !== undefined ? { statusCode } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(spanInput !== undefined ? { inputTokens: spanInput } : {}),
      ...(spanOutput !== undefined ? { outputTokens: spanOutput } : {}),
    });
  });

  if (steps.length === 0) {
    throw new Error(
      'No agent, model, tool, or HTTP spans were found in that trace.',
    );
  }

  steps.sort((left, right) => {
    const a = stepTimes.get(left.id);
    const b = stepTimes.get(right.id);
    if (a === undefined || b === undefined) return 0;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  const durationMs =
    starts.length > 0 && ends.length > 0
      ? Math.round((Math.max(...ends) - Math.min(...starts)) / 1_000_000)
      : null;

  return {
    agent,
    model,
    durationMs:
      durationMs !== null && Number.isSafeInteger(durationMs)
        ? durationMs
        : null,
    inputTokens: tokenSpans.size > 0 ? inputTokens : null,
    outputTokens: tokenSpans.size > 0 ? outputTokens : null,
    steps,
  };
}
