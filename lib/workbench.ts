import type { ToolAuditCheck, ToolAuditResult } from '@/lib/types';

const SAMPLE_BOILERPLATE = `const registration = new AbortController();

if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "search_catalog",
    title: "Search catalog",
    description: "Find public catalog items that match explicit filters.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          maxLength: 120,
          description: "Product words to search for."
        },
        max_price: {
          type: "number",
          minimum: 0,
          description: "Maximum price in USD."
        }
      },
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true
    },
    async execute(input, { signal }) {
      const filters = validateSearchInput(input);
      const items = await catalog.search(filters, { signal });
      return { items, count: items.length };
    }
  }, { signal: registration.signal });
}

// Keep this callback and invoke it only on route change or component unmount.
const unregisterPageTools = () => registration.abort();`;

function check(
  id: string,
  title: string,
  status: ToolAuditCheck['status'],
  detail: string,
  standard: ToolAuditCheck['standard'],
): ToolAuditCheck {
  return { id, title, status, detail, standard };
}

function extractNames(code: string): string[] {
  const names = new Set<string>();
  for (const match of code.matchAll(/\bname\s*:\s*["'`]([^"'`]+)["'`]/g)) {
    names.add(match[1]);
  }
  for (const match of code.matchAll(/\btoolname\s*=\s*["']([^"']+)["']/gi)) {
    names.add(match[1]);
  }
  return [...names].slice(0, 20);
}

function averageStatus(checks: ToolAuditCheck[], ids: string[]): number {
  const points: Record<ToolAuditCheck['status'], number> = {
    pass: 100,
    info: 75,
    warn: 45,
    fail: 0,
  };
  const selected = checks.filter((item) => ids.includes(item.id));
  return selected.length
    ? Math.round(
        selected.reduce((sum, item) => sum + points[item.status], 0) /
          selected.length,
      )
    : 0;
}

export function auditToolCode(source: string): ToolAuditResult {
  const code = source.slice(0, 100_000);
  const names = extractNames(code);
  const descriptions = Array.from(
    code.matchAll(/\bdescription\s*:\s*["'`]([^"'`]*)["'`]/g),
  ).map((match) => match[1]);
  const longDescription = descriptions.find(
    (description) => description.length > 500,
  );
  const longParameterDescription = descriptions.find(
    (description) => description.length > 150,
  );
  const sensitiveParameters = Array.from(
    code.matchAll(
      /\b(age|gender|ethnicity|race|height|weight|religion|political_affiliation|medical_history|browsing_history)\b/gi,
    ),
  ).map((match) => match[1].toLowerCase());

  const checks: ToolAuditCheck[] = [
    check(
      'feature',
      'Current feature detection',
      /document\.modelContext/.test(code) ? 'pass' : 'fail',
      /document\.modelContext/.test(code)
        ? 'Uses the current document.modelContext surface.'
        : 'No current document.modelContext feature detection was found.',
      'draft',
    ),
    check(
      'deprecated',
      'No obsolete navigator global',
      /navigator\.modelContext/.test(code) ? 'fail' : 'pass',
      /navigator\.modelContext/.test(code)
        ? 'navigator.modelContext belongs to an older proposal and should be replaced.'
        : 'No navigator.modelContext reference was found.',
      'draft',
    ),
    check(
      'registration',
      'Imperative registration',
      /document\.modelContext\.registerTool\s*\(/.test(code) ? 'pass' : 'warn',
      /document\.modelContext\.registerTool\s*\(/.test(code)
        ? 'An imperative tool registration is source-visible.'
        : 'No imperative registration was found. Declarative behavior remains draft and has uneven agent support.',
      'draft',
    ),
    check(
      'names',
      'Tool names are valid and compact',
      names.length &&
        names.every((name) => /^[A-Za-z0-9_.-]{1,128}$/.test(name))
        ? names.every((name) => name.length <= 30)
          ? 'pass'
          : 'info'
        : 'fail',
      names.length
        ? `${names.length} tool name${names.length === 1 ? '' : 's'} detected. The draft permits 1–128 ASCII letters, numbers, underscore, hyphen, and period; Chrome recommends about 30 characters.`
        : 'No stable tool name was detected.',
      'draft',
    ),
    check(
      'schema',
      'Closed input schemas',
      /additionalProperties\s*:\s*false/.test(code) ? 'pass' : 'warn',
      /additionalProperties\s*:\s*false/.test(code)
        ? 'At least one schema rejects undeclared properties.'
        : 'Add additionalProperties: false where compatible and validate again at runtime.',
      'project_rule',
    ),
    check(
      'runtime_validation',
      'Runtime input validation',
      /(safeParse|\.parse\s*\(|validate[A-Z_a-z]|assert[A-Z_a-z])/.test(code)
        ? 'pass'
        : 'warn',
      /(safeParse|\.parse\s*\(|validate[A-Z_a-z]|assert[A-Z_a-z])/.test(code)
        ? 'A runtime validation seam is source-visible.'
        : 'The browser does not currently enforce JSON Schema semantics; validate input inside execute or the backend.',
      'draft',
    ),
    check(
      'abort',
      'Registration lifecycle cleanup',
      /AbortController/.test(code) &&
        /registerTool\s*\([\s\S]*?signal/.test(code)
        ? 'pass'
        : 'warn',
      /AbortController/.test(code) &&
        /registerTool\s*\([\s\S]*?signal/.test(code)
        ? 'Registration uses an AbortSignal so route or component teardown can unregister the tool.'
        : 'Pass an AbortSignal in registration options and abort it when the owning UI context unmounts.',
      'draft',
    ),
    check(
      'annotations',
      'Behavior annotations are explicit',
      /readOnlyHint\s*:/.test(code) ? 'pass' : 'warn',
      /readOnlyHint\s*:/.test(code)
        ? 'A read-only behavior hint is source-visible. Confirm it matches the actual effect.'
        : 'Declare readOnlyHint truthfully; omitted defaults to false in the current draft.',
      'draft',
    ),
    check(
      'untrusted',
      'Untrusted output is labeled',
      /untrustedContentHint\s*:\s*true/.test(code) ? 'pass' : 'info',
      /untrustedContentHint\s*:\s*true/.test(code)
        ? 'Tool output is marked as untrusted.'
        : 'If output includes user-generated or external content, set untrustedContentHint: true.',
      'chrome_guidance',
    ),
    check(
      'description_budget',
      'Metadata stays within current guidance',
      longDescription
        ? 'fail'
        : longParameterDescription
          ? 'warn'
          : descriptions.length
            ? 'pass'
            : 'warn',
      longDescription
        ? `A description is ${longDescription.length} characters; Chrome currently recommends about 500 per tool.`
        : longParameterDescription
          ? 'A description exceeds Chrome’s current 150-character parameter-description recommendation.'
          : descriptions.length
            ? 'Detected descriptions fit the current non-normative Chrome character budgets.'
            : 'No literal descriptions were detected.',
      'chrome_guidance',
    ),
    check(
      'over_parameterization',
      'Parameter minimization',
      sensitiveParameters.length ? 'fail' : 'pass',
      sensitiveParameters.length
        ? `Potentially excessive personal fields detected: ${[...new Set(sensitiveParameters)].join(', ')}. Confirm each is strictly necessary.`
        : 'No common demographic or profiling fields were detected by this static check.',
      'draft',
    ),
    check(
      'verification',
      'Results support state verification',
      /(return\s+\{|verified|previousState|newState|status|success)/.test(code)
        ? 'pass'
        : 'warn',
      /(return\s+\{|verified|previousState|newState|status|success)/.test(code)
        ? 'A structured result or verification field is source-visible.'
        : 'Return concise postcondition fields so the agent and user can verify the effect.',
      'project_rule',
    ),
  ];

  return {
    conformance: averageStatus(checks, [
      'feature',
      'deprecated',
      'registration',
      'names',
      'schema',
      'runtime_validation',
    ]),
    security: averageStatus(checks, [
      'annotations',
      'untrusted',
      'description_budget',
      'over_parameterization',
      'verification',
    ]),
    lifecycle: averageStatus(checks, ['abort']),
    detectedNames: names,
    checks,
    boilerplate: SAMPLE_BOILERPLATE,
  };
}

export { SAMPLE_BOILERPLATE };
