'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  DEMO_PRODUCTS,
  DEMO_TASK,
  classifyJourneyPath,
  evaluateDemoRun,
  filterDemoProducts,
  getDemoProduct,
  makeControlledRun,
  type ProductFilters,
} from '@/lib/demo';
import { calculateLift } from '@/lib/scoring';
import type {
  DemoProduct,
  JourneyEvent,
  JourneyRun,
  LiftResult,
  ScanErrorBody,
  ScanReport,
} from '@/lib/types';

type ActionOrigin = 'ui' | 'tool';

interface DemoSnapshot {
  mode: 'baseline' | 'webmcp';
  activeRun: JourneyRun | null;
  baselineRun: JourneyRun | null;
  webmcpRun: JourneyRun | null;
  visibleProductIds: string[];
  filters: ProductFilters;
  searchPerformed: boolean;
  comparedIds: string[];
  cartProductId: string | null;
  cartQuantity: number;
  checkoutAttempted: boolean;
}

interface ExportState {
  format: 'json' | 'print';
  preparedAt: string;
  href: string;
}

interface AppContextValue {
  scanDraft: { url: string; goal: string };
  setScanDraft: (draft: { url: string; goal: string }) => void;
  scanLoading: boolean;
  scanError: string | null;
  currentReport: ScanReport | null;
  runScan: (
    url: string,
    goal?: string,
    navigate?: boolean,
    signal?: AbortSignal,
  ) => Promise<ScanReport>;
  setCurrentReport: (report: ScanReport | null) => void;
  webmcpAvailable: boolean;
  demoToolsAvailable: boolean;
  demo: DemoSnapshot;
  visibleProducts: DemoProduct[];
  cartProduct: DemoProduct | null;
  lift: LiftResult | null;
  selectDemoMode: (mode: 'baseline' | 'webmcp', navigate?: boolean) => void;
  startDemoRun: (origin?: ActionOrigin) => JourneyRun;
  searchDemoProducts: (
    filters: ProductFilters,
    origin?: ActionOrigin,
  ) => DemoProduct[];
  compareDemoProducts: (ids: string[], origin?: ActionOrigin) => DemoProduct[];
  addDemoProductToCart: (
    id: string,
    quantity?: number,
    origin?: ActionOrigin,
  ) => DemoProduct;
  finishDemoRun: (origin?: ActionOrigin) => JourneyRun;
  recordHumanIntervention: () => void;
  recordUiInteraction: (
    label: string,
    detail: string,
    taskStep: 'search' | 'compare',
  ) => void;
  attemptCheckout: (origin?: ActionOrigin) => never;
  runControlledComparison: () => void;
  exportPrepared: ExportState | null;
  prepareExport: (format: 'json' | 'print') => ExportState;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialDemo: DemoSnapshot = {
  mode: 'baseline',
  activeRun: null,
  baselineRun: null,
  webmcpRun: null,
  visibleProductIds: DEMO_PRODUCTS.map((product) => product.id),
  filters: {},
  searchPerformed: false,
  comparedIds: [],
  cartProductId: null,
  cartQuantity: 0,
  checkoutAttempted: false,
};

class ToolContractError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ToolContractError';
  }
}

function toolFailure(code: string, message: string): never {
  throw new ToolContractError(code, message);
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    toolFailure('INVALID_INPUT', 'Expected an object input.');
  }
  return input as Record<string, unknown>;
}

function exactRecord(
  input: unknown,
  allowedKeys: readonly string[],
): Record<string, unknown> {
  const record = asRecord(input);
  const unknownKey = Object.keys(record).find(
    (key) => !allowedKeys.includes(key),
  );
  if (unknownKey)
    toolFailure('INVALID_INPUT', `Unknown input property: ${unknownKey}.`);
  return record;
}

function guardToolExecution(
  execute: WebMCPToolDefinition['execute'],
): WebMCPToolDefinition['execute'] {
  return async (input, options) => {
    try {
      return await execute(input, options);
    } catch (error) {
      if (error instanceof ToolContractError) {
        return {
          ok: false,
          error: { code: error.code, message: error.message },
        };
      }
      throw error;
    }
  };
}

function stringInput(
  input: Record<string, unknown>,
  key: string,
  options: { required?: boolean; max?: number } = {},
): string | undefined {
  const value = input[key];
  if (value === undefined || value === null || value === '') {
    if (options.required) toolFailure('INVALID_INPUT', `${key} is required.`);
    return undefined;
  }
  if (typeof value !== 'string')
    toolFailure('INVALID_INPUT', `${key} must be a string.`);
  if (options.max && value.length > options.max)
    toolFailure('INVALID_INPUT', `${key} is too long.`);
  return value;
}

function numberInput(
  input: Record<string, unknown>,
  key: string,
  options: { integer?: boolean; min?: number; max?: number } = {},
): number | undefined {
  const value = input[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value))
    toolFailure('INVALID_INPUT', `${key} must be a number.`);
  if (options.integer && !Number.isInteger(value))
    toolFailure('INVALID_INPUT', `${key} must be an integer.`);
  if (options.min !== undefined && value < options.min)
    toolFailure('INVALID_INPUT', `${key} is below the minimum.`);
  if (options.max !== undefined && value > options.max)
    toolFailure('INVALID_INPUT', `${key} is above the maximum.`);
  return value;
}

function withEvent(
  run: JourneyRun,
  kind: JourneyEvent['kind'],
  label: string,
  detail: string,
  origin?: ActionOrigin,
  taskStep?: JourneyEvent['taskStep'],
): JourneyRun {
  const atMs = Math.max(0, Date.now() - Date.parse(run.startedAt));
  const events = [
    ...run.events,
    {
      id: `event_${crypto.randomUUID().slice(0, 8)}`,
      atMs,
      kind,
      label,
      detail,
      taskStep,
    },
  ];
  return {
    ...run,
    path: classifyJourneyPath(events),
    uiActionCount: run.uiActionCount + (origin === 'ui' ? 1 : 0),
    webmcpCallCount: run.webmcpCallCount + (origin === 'tool' ? 1 : 0),
    events,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [scanDraftState, setScanDraftState] = useState({ url: '', goal: '' });
  const scanDraftRef = useRef(scanDraftState);
  const setScanDraft = useCallback((draft: { url: string; goal: string }) => {
    scanDraftRef.current = draft;
    setScanDraftState(draft);
  }, []);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [exportPrepared, setExportPrepared] = useState<ExportState | null>(
    null,
  );
  const [currentReportState, setCurrentReportState] =
    useState<ScanReport | null>(null);
  const currentReportRef = useRef<ScanReport | null>(null);
  const setCurrentReport = useCallback((report: ScanReport | null) => {
    currentReportRef.current = report;
    setCurrentReportState(report);
    setExportPrepared(null);
    if (report && typeof sessionStorage !== 'undefined') {
      const key = `iswebmcp:report:${report.id}`;
      try {
        for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
          const existing = sessionStorage.key(index);
          if (existing?.startsWith('iswebmcp:report:') && existing !== key) {
            sessionStorage.removeItem(existing);
          }
        }
        sessionStorage.setItem(key, JSON.stringify(report));
      } catch {
        // Session persistence is a best-effort navigation aid. A full or
        // unavailable storage area must never turn a successful scan into a failure.
        try {
          sessionStorage.removeItem(key);
        } catch {
          // Ignore storage implementations that reject all access.
        }
      }
    }
  }, []);

  const [demoState, setDemoState] = useState<DemoSnapshot>(initialDemo);
  const demoRef = useRef<DemoSnapshot>(initialDemo);
  const commitDemo = useCallback(
    (update: DemoSnapshot | ((current: DemoSnapshot) => DemoSnapshot)) => {
      const next =
        typeof update === 'function' ? update(demoRef.current) : update;
      demoRef.current = next;
      setDemoState(next);
      return next;
    },
    [],
  );
  const [webmcpAvailable, setWebmcpAvailable] = useState(false);
  const [demoToolsAvailable, setDemoToolsAvailable] = useState(false);

  const runScan = useCallback(
    async (url: string, goal = '', navigate = true, signal?: AbortSignal) => {
      setScanDraft({ url, goal });
      setScanLoading(true);
      setScanError(null);
      try {
        const response = await fetch('/api/scans', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, goal: goal || undefined }),
          signal,
        });
        const payload = (await response.json()) as
          | ScanReport
          | { error?: { code?: string; message?: string } };
        if (!response.ok || !('id' in payload)) {
          const supported = new Set<ScanErrorBody['error']['code']>([
            'INVALID_INPUT',
            'UNSAFE_TARGET',
            'UNSUPPORTED_CONTENT',
            'UPSTREAM_TIMEOUT',
            'UPSTREAM_FAILURE',
            'RESPONSE_TOO_LARGE',
            'RATE_LIMITED',
          ]);
          const code =
            'error' in payload &&
            payload.error?.code &&
            supported.has(payload.error.code as ScanErrorBody['error']['code'])
              ? payload.error.code
              : 'UPSTREAM_FAILURE';
          toolFailure(
            code,
            'error' in payload
              ? (payload.error?.message ?? 'The scan failed.')
              : 'The scan failed.',
          );
        }
        setCurrentReport(payload);
        if (navigate) router.push(`/reports/${payload.id}`);
        return payload;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'The scan could not be completed.';
        setScanError(message);
        throw error;
      } finally {
        setScanLoading(false);
      }
    },
    [router, setCurrentReport, setScanDraft],
  );

  const selectDemoMode = useCallback(
    (mode: 'baseline' | 'webmcp', navigate = true) => {
      commitDemo((current) => ({
        ...current,
        mode,
        activeRun: null,
        visibleProductIds: DEMO_PRODUCTS.map((product) => product.id),
        filters: {},
        searchPerformed: false,
        comparedIds: [],
        cartProductId: null,
        cartQuantity: 0,
        checkoutAttempted: false,
      }));
      if (navigate && pathname !== '/lab') router.push('/lab');
    },
    [commitDemo, pathname, router],
  );

  const startDemoRun = useCallback(
    (_origin: ActionOrigin = 'ui') => {
      const current = demoRef.current;
      if (current.activeRun)
        toolFailure(
          'INVALID_STATE',
          'Finish the active run before starting another.',
        );
      const mode = current.mode;
      const partner =
        mode === 'baseline' ? current.webmcpRun : current.baselineRun;
      const sameModeRun =
        mode === 'baseline' ? current.baselineRun : current.webmcpRun;
      const joinsExistingPair = Boolean(
        partner && !sameModeRun && partner.evidenceMode === 'interactive',
      );
      const comparisonId = joinsExistingPair
        ? (partner as JourneyRun).comparisonId
        : `pair_${crypto.randomUUID().slice(0, 8)}`;
      const run: JourneyRun = {
        id: `${mode}_${crypto.randomUUID().slice(0, 8)}`,
        mode,
        path: 'none',
        comparisonId,
        fixtureVersion: 'headset-v1',
        taskId: 'headset_research',
        evidenceMode: 'interactive',
        startedAt: new Date().toISOString(),
        success: false,
        elapsedMs: 0,
        uiActionCount: 0,
        webmcpCallCount: 0,
        invalidAttemptCount: 0,
        humanInterventionCount: 0,
        assertions: [],
        events: [
          {
            id: `event_${crypto.randomUUID().slice(0, 8)}`,
            atMs: 0,
            kind: 'state',
            label: 'Run started',
            detail: `${mode === 'baseline' ? 'UI-only' : 'WebMCP-enabled'} mode; identical catalog and success criteria.`,
          },
        ],
      };
      commitDemo((current) => ({
        ...current,
        activeRun: run,
        baselineRun: joinsExistingPair ? current.baselineRun : null,
        webmcpRun: joinsExistingPair ? current.webmcpRun : null,
        visibleProductIds: DEMO_PRODUCTS.map((product) => product.id),
        filters: {},
        searchPerformed: false,
        comparedIds: [],
        cartProductId: null,
        cartQuantity: 0,
        checkoutAttempted: false,
      }));
      if (pathname !== '/lab') router.push('/lab');
      return run;
    },
    [commitDemo, pathname, router],
  );

  const searchDemoProducts = useCallback(
    (filters: ProductFilters, origin: ActionOrigin = 'ui') => {
      const current = demoRef.current;
      if (origin === 'tool' && current.mode !== 'webmcp')
        toolFailure(
          'INVALID_STATE',
          'Structured demo tools are unavailable in baseline mode.',
        );
      if (origin === 'tool' && !current.activeRun)
        toolFailure('INVALID_STATE', 'Start a demo run before searching.');
      const products = filterDemoProducts(filters);
      commitDemo((snapshot) => ({
        ...snapshot,
        filters,
        searchPerformed: true,
        visibleProductIds: products.map((product) => product.id),
        activeRun: snapshot.activeRun
          ? withEvent(
              snapshot.activeRun,
              origin === 'tool' ? 'tool' : 'ui',
              origin === 'tool' ? 'search_demo_products' : 'Catalog filtered',
              `${products.length} product${products.length === 1 ? '' : 's'} match the visible constraints.`,
              origin,
              'search',
            )
          : null,
      }));
      return products;
    },
    [commitDemo],
  );

  const compareDemoProducts = useCallback(
    (ids: string[], origin: ActionOrigin = 'ui') => {
      const unique = [...new Set(ids)];
      const current = demoRef.current;
      if (origin === 'tool' && current.mode !== 'webmcp')
        toolFailure(
          'INVALID_STATE',
          'Structured demo tools are unavailable in baseline mode.',
        );
      if (origin === 'tool' && !current.activeRun)
        toolFailure('INVALID_STATE', 'Start a demo run before comparing.');
      if (!current.searchPerformed)
        toolFailure(
          'INVALID_STATE',
          'Search the catalog before comparing products.',
        );
      if (unique.length < 2 || unique.length > 4)
        toolFailure('INVALID_INPUT', 'Compare two to four unique product IDs.');
      if (unique.some((id) => !current.visibleProductIds.includes(id)))
        toolFailure(
          'INVALID_STATE',
          'Compared products must come from the visible search results.',
        );
      const products = unique.map((id) => getDemoProduct(id));
      if (products.some((product) => !product))
        toolFailure('NOT_FOUND', 'One or more product IDs are unknown.');
      commitDemo((snapshot) => ({
        ...snapshot,
        comparedIds: unique,
        activeRun: snapshot.activeRun
          ? withEvent(
              snapshot.activeRun,
              origin === 'tool' ? 'tool' : 'ui',
              origin === 'tool' ? 'compare_demo_products' : 'Products compared',
              unique.join(', '),
              origin,
              'compare',
            )
          : null,
      }));
      return products as DemoProduct[];
    },
    [commitDemo],
  );

  const addDemoProductToCart = useCallback(
    (id: string, quantity = 1, origin: ActionOrigin = 'ui') => {
      const current = demoRef.current;
      if (origin === 'tool' && current.mode !== 'webmcp')
        toolFailure(
          'INVALID_STATE',
          'Structured demo tools are unavailable in baseline mode.',
        );
      if (origin === 'tool' && !current.activeRun)
        toolFailure(
          'INVALID_STATE',
          'Start a demo run before updating the cart.',
        );
      if (!current.comparedIds.includes(id))
        toolFailure(
          'INVALID_STATE',
          'Compare a product before adding it to the cart.',
        );
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5)
        toolFailure(
          'INVALID_INPUT',
          'Quantity must be an integer from one to five.',
        );
      const product = getDemoProduct(id);
      if (!product) toolFailure('NOT_FOUND', 'The product ID is unknown.');
      commitDemo((snapshot) => ({
        ...snapshot,
        cartProductId: product.id,
        cartQuantity: quantity,
        activeRun: snapshot.activeRun
          ? withEvent(
              snapshot.activeRun,
              origin === 'tool' ? 'tool' : 'ui',
              origin === 'tool'
                ? 'add_demo_product_to_cart'
                : 'Synthetic cart updated',
              `${quantity} × ${product.name}; no purchase occurred.`,
              origin,
              'cart',
            )
          : null,
      }));
      return product;
    },
    [commitDemo],
  );

  const finishDemoRun = useCallback(
    (origin: ActionOrigin = 'ui') => {
      const current = demoRef.current;
      if (!current.activeRun)
        toolFailure('INVALID_STATE', 'No demo run is active.');
      const assertions = evaluateDemoRun(
        current.comparedIds,
        current.cartProductId,
        current.checkoutAttempted,
        current.filters,
      );
      let run = withEvent(
        current.activeRun,
        origin === 'tool' ? 'tool' : 'ui',
        origin === 'tool' ? 'finish_demo_run' : 'Run verified',
        `${assertions.filter((assertion) => assertion.passed).length} of ${assertions.length} deterministic assertions passed.`,
        origin,
        'verify',
      );
      run = {
        ...run,
        completedAt: new Date().toISOString(),
        elapsedMs: Math.max(1, Date.now() - Date.parse(run.startedAt)),
        assertions,
        success: assertions.every((assertion) => assertion.passed),
      };
      commitDemo((snapshot) => ({
        ...snapshot,
        activeRun: null,
        baselineRun: run.mode === 'baseline' ? run : snapshot.baselineRun,
        webmcpRun: run.mode === 'webmcp' ? run : snapshot.webmcpRun,
      }));
      return run;
    },
    [commitDemo],
  );

  const recordHumanIntervention = useCallback(() => {
    commitDemo((snapshot) => ({
      ...snapshot,
      activeRun: snapshot.activeRun
        ? {
            ...withEvent(
              snapshot.activeRun,
              'human',
              'Human intervention',
              'The user provided manual recovery or guidance.',
            ),
            humanInterventionCount:
              snapshot.activeRun.humanInterventionCount + 1,
          }
        : null,
    }));
  }, [commitDemo]);

  const recordUiInteraction = useCallback(
    (label: string, detail: string, taskStep: 'search' | 'compare') => {
      commitDemo((snapshot) => ({
        ...snapshot,
        activeRun: snapshot.activeRun
          ? withEvent(snapshot.activeRun, 'ui', label, detail, 'ui', taskStep)
          : null,
      }));
    },
    [commitDemo],
  );

  const attemptCheckout = useCallback(
    (origin: ActionOrigin = 'ui'): never => {
      commitDemo((snapshot) => ({
        ...snapshot,
        checkoutAttempted: true,
        activeRun: snapshot.activeRun
          ? {
              ...withEvent(
                snapshot.activeRun,
                'rejected',
                'Checkout blocked',
                'The lab has no checkout capability and cannot perform a transaction.',
                origin,
              ),
              invalidAttemptCount: snapshot.activeRun.invalidAttemptCount + 1,
            }
          : null,
      }));
      toolFailure(
        'UNSUPPORTED',
        'Checkout is intentionally unavailable. This lab stops before purchase.',
      );
    },
    [commitDemo],
  );

  const runControlledComparison = useCallback(() => {
    const comparisonId = `replay_${crypto.randomUUID().slice(0, 8)}`;
    const baselineRun = makeControlledRun('baseline', comparisonId);
    const webmcpRun = makeControlledRun('webmcp', comparisonId);
    commitDemo({
      ...initialDemo,
      mode: 'webmcp',
      baselineRun,
      webmcpRun,
      visibleProductIds: filterDemoProducts({
        maxPrice: 300,
        minimumRating: 4.5,
        minimumBatteryHours: 30,
        features: ['noise_canceling'],
      }).map((product) => product.id),
      comparedIds: ['aurora-q45', 'sonic-arc'],
      cartProductId: 'aurora-q45',
      cartQuantity: 1,
      searchPerformed: true,
    });
    if (pathname !== '/lab') router.push('/lab');
  }, [commitDemo, pathname, router]);

  const prepareExport = useCallback(
    (format: 'json' | 'print') => {
      const report = currentReportRef.current;
      if (!report)
        toolFailure('INVALID_STATE', 'No report is currently displayed.');
      const state: ExportState = {
        format,
        preparedAt: new Date().toISOString(),
        href: '#export-controls',
      };
      setExportPrepared(state);
      router.push(`/reports/${report.id}#export-controls`);
      return state;
    },
    [router],
  );

  const actionsRef = useRef({
    runScan,
    selectDemoMode,
    startDemoRun,
    searchDemoProducts,
    compareDemoProducts,
    addDemoProductToCart,
    finishDemoRun,
    attemptCheckout,
    prepareExport,
  });
  useEffect(() => {
    actionsRef.current = {
      runScan,
      selectDemoMode,
      startDemoRun,
      searchDemoProducts,
      compareDemoProducts,
      addDemoProductToCart,
      finishDemoRun,
      attemptCheckout,
      prepareExport,
    };
  }, [
    addDemoProductToCart,
    attemptCheckout,
    compareDemoProducts,
    finishDemoRun,
    prepareExport,
    runScan,
    searchDemoProducts,
    selectDemoMode,
    startDemoRun,
  ]);

  useEffect(() => {
    const context = document.modelContext;
    queueMicrotask(() => setWebmcpAvailable(false));
    if (!context?.registerTool) return;
    const registration = new AbortController();
    const emptySchema = {
      type: 'object',
      properties: {},
      additionalProperties: false,
    };
    const visibleReportId = pathname.startsWith('/reports/')
      ? pathname.split('/')[2]
      : null;
    const getVisibleReport = () => {
      const report = currentReportRef.current;
      if (!report || !visibleReportId || report.id !== visibleReportId) {
        toolFailure(
          'INVALID_STATE',
          'No matching report is currently displayed.',
        );
      }
      return report;
    };
    const tools: WebMCPToolDefinition[] = [
      {
        name: 'scan_public_url',
        title: 'Scan a public URL',
        description:
          'Run a safe public-source scan and show its evidence report. Does not execute target JavaScript.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              maxLength: 2048,
              description: 'Absolute public HTTP or HTTPS URL.',
            },
            goal: {
              type: 'string',
              maxLength: 300,
              description: 'Optional task the user wants an agent to complete.',
            },
          },
          required: ['url'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (raw, options) => {
          const input = exactRecord(raw, ['url', 'goal']);
          const url = stringInput(input, 'url', {
            required: true,
            max: 2048,
          }) as string;
          const goal = stringInput(input, 'goal', { max: 300 });
          const report = await actionsRef.current.runScan(
            url,
            goal,
            true,
            options.signal,
          );
          return {
            scan_id: report.id,
            normalized_url: report.normalizedUrl,
            status: report.status,
            next_action: 'Review the evidence report and its limitations.',
          };
        },
      },
      {
        name: 'get_scan_summary',
        title: 'Read scan summary',
        description:
          'Read the visible scan score, strongest evidence, limitations, and top recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            scan_id: {
              type: 'string',
              maxLength: 80,
              description: 'Optional current scan ID.',
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: (raw) => {
          const input = exactRecord(raw, ['scan_id']);
          const requested = stringInput(input, 'scan_id', { max: 80 });
          const report = getVisibleReport();
          if (requested && requested !== report.id)
            toolFailure(
              'NOT_FOUND',
              'The requested scan is not currently displayed.',
            );
          return {
            scan_id: report.id,
            implementation_state: report.implementationState,
            baseline_actionability: report.baselineActionability.value,
            evidence_coverage: report.baselineActionability.coverage,
            webmcp_quality: report.webmcpQuality
              ? {
                  value: report.webmcpQuality.value,
                  evidence_coverage: report.webmcpQuality.coverage,
                  evidence_source: report.importedProof
                    ? 'imported'
                    : 'runtime',
                  independently_verified: !report.importedProof,
                }
              : 'not_enough_runtime_evidence',
            strongest_evidence: report.strongestEvidence,
            limitations: report.limitations,
            recommendations: report.recommendations.slice(0, 3),
          };
        },
      },
      {
        name: 'list_action_surface',
        title: 'List action surface',
        description:
          'List source-inferred actions and distinguish human UI, WebMCP, missing, and withheld coverage.',
        inputSchema: {
          type: 'object',
          properties: {
            scan_id: {
              type: 'string',
              maxLength: 80,
              description: 'Optional current scan ID.',
            },
            status: {
              type: 'string',
              enum: [
                'all',
                'human_ui',
                'agent_ui',
                'webmcp',
                'missing',
                'withheld',
              ],
              description: 'Coverage class to return.',
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: (raw) => {
          const input = exactRecord(raw, ['scan_id', 'status']);
          const report = getVisibleReport();
          const requested = stringInput(input, 'scan_id', { max: 80 });
          if (requested && requested !== report.id)
            toolFailure(
              'NOT_FOUND',
              'The requested scan is not currently displayed.',
            );
          const status = stringInput(input, 'status') ?? 'all';
          const allowed = [
            'all',
            'human_ui',
            'agent_ui',
            'webmcp',
            'missing',
            'withheld',
          ];
          if (!allowed.includes(status))
            toolFailure('INVALID_INPUT', 'Unknown action-surface status.');
          const actions = report.actionSurface.filter((action) => {
            if (status === 'all') return true;
            if (status === 'human_ui' || status === 'agent_ui')
              return action.humanUiAvailable;
            if (status === 'webmcp')
              return ['imported', 'verified'].includes(action.webmcpStatus);
            if (status === 'missing') return action.webmcpStatus === 'missing';
            return action.webmcpStatus === 'withheld';
          });
          return {
            scan_id: report.id,
            evidence_source: 'source_and_inference',
            actions,
          };
        },
      },
      {
        name: 'get_finding_details',
        title: 'Read finding details',
        description:
          'Read evidence, confidence, impact, and remediation for one finding in the visible report.',
        inputSchema: {
          type: 'object',
          properties: {
            finding_id: {
              type: 'string',
              maxLength: 100,
              description: 'Finding ID from the visible report.',
            },
          },
          required: ['finding_id'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: (raw) => {
          const id = stringInput(
            exactRecord(raw, ['finding_id']),
            'finding_id',
            { required: true, max: 100 },
          );
          const report = getVisibleReport();
          const finding = report.findings.find((item) => item.id === id);
          if (!finding) toolFailure('NOT_FOUND', 'The finding ID is unknown.');
          return {
            finding,
            evidence: report.evidence.filter((item) =>
              finding.evidenceIds.includes(item.id),
            ),
          };
        },
      },
      {
        name: 'select_demo_mode',
        title: 'Select demo mode',
        description:
          'Reset the synthetic lab and select UI-only baseline or WebMCP-enabled mode.',
        inputSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['baseline', 'webmcp'],
              description: 'Proof-lab mode.',
            },
          },
          required: ['mode'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const mode = stringInput(exactRecord(raw, ['mode']), 'mode', {
            required: true,
          });
          if (mode !== 'baseline' && mode !== 'webmcp')
            toolFailure('INVALID_INPUT', 'Mode must be baseline or webmcp.');
          actionsRef.current.selectDemoMode(mode, true);
          return {
            mode,
            reset: true,
            changed:
              mode === 'webmcp'
                ? 'Structured demo-tool registration was requested; the visible lab reports availability.'
                : 'Structured search, compare, and cart tools are now unregistered.',
          };
        },
      },
      {
        name: 'start_demo_run',
        title: 'Start demo run',
        description:
          'Start the supported synthetic headset journey and show its deterministic success criteria.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              enum: ['headset_research'],
              description: 'Supported synthetic task ID.',
            },
          },
          required: ['task_id'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const task = stringInput(exactRecord(raw, ['task_id']), 'task_id', {
            required: true,
          });
          if (task !== 'headset_research')
            toolFailure('UNSUPPORTED', 'Only headset_research is supported.');
          const run = actionsRef.current.startDemoRun('tool');
          return {
            run_id: run.id,
            mode: run.mode,
            goal: DEMO_TASK.goal,
            success_criteria: DEMO_TASK.criteria,
          };
        },
      },
      {
        name: 'finish_demo_run',
        title: 'Finish demo run',
        description:
          'Stop the active synthetic run and evaluate its visible state without performing checkout.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              maxLength: 80,
              description: 'Optional active run ID.',
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const requested = stringInput(
            exactRecord(raw, ['run_id']),
            'run_id',
            { max: 80 },
          );
          const active = demoRef.current.activeRun;
          if (!active || (requested && active.id !== requested))
            toolFailure('NOT_FOUND', 'The requested run is not active.');
          const run = actionsRef.current.finishDemoRun('tool');
          return {
            run_id: run.id,
            success: run.success,
            elapsed_ms: run.elapsedMs,
            assertions: run.assertions,
            checkout_performed: false,
          };
        },
      },
      {
        name: 'compare_demo_runs',
        title: 'Compare demo runs',
        description:
          'Compare the latest completed baseline and WebMCP runs and calculate WebMCP Lift.',
        inputSchema: emptySchema,
        annotations: { readOnlyHint: true },
        execute: (raw) => {
          exactRecord(raw, []);
          const { baselineRun, webmcpRun } = demoRef.current;
          if (!baselineRun || !webmcpRun)
            toolFailure(
              'INVALID_STATE',
              'Complete one run in each mode before comparing.',
            );
          return calculateLift(baselineRun, webmcpRun);
        },
      },
      {
        name: 'export_current_report',
        title: 'Prepare report export',
        description:
          'Prepare a visible JSON or print export for the current report without an opaque download.',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'print'],
              description: 'Export format to prepare.',
            },
          },
          required: ['format'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const format = stringInput(exactRecord(raw, ['format']), 'format', {
            required: true,
          });
          if (format !== 'json' && format !== 'print')
            toolFailure('INVALID_INPUT', 'Format must be json or print.');
          getVisibleReport();
          const prepared = actionsRef.current.prepareExport(format);
          return {
            prepared: true,
            ...prepared,
            next_action: 'Review the visible export controls.',
          };
        },
      },
    ];

    const reportOnly = new Set([
      'get_scan_summary',
      'list_action_surface',
      'get_finding_details',
      'export_current_report',
    ]);
    const labOnly = new Set([
      'start_demo_run',
      'finish_demo_run',
      'compare_demo_runs',
    ]);
    const webmcpModeOnly = new Set(['start_demo_run', 'finish_demo_run']);
    const scopedTools = tools.filter((tool) =>
      reportOnly.has(tool.name)
        ? pathname.startsWith('/reports/')
        : labOnly.has(tool.name)
          ? pathname === '/lab' &&
            (!webmcpModeOnly.has(tool.name) || demoState.mode === 'webmcp')
          : true,
    );
    let cancelled = false;
    let allRegistrationsSucceeded = true;
    void (async () => {
      for (const tool of scopedTools) {
        if (cancelled) break;
        try {
          await context.registerTool(
            { ...tool, execute: guardToolExecution(tool.execute) },
            { signal: registration.signal },
          );
        } catch (error) {
          allRegistrationsSucceeded = false;
          if (
            !registration.signal.aborted &&
            !(error instanceof DOMException && error.name === 'AbortError')
          ) {
            // A duplicate registration can occur briefly during HMR; feature fallback remains usable.
          }
        }
      }
      if (!cancelled && scopedTools.length > 0 && allRegistrationsSucceeded)
        setWebmcpAvailable(true);
    })();
    return () => {
      cancelled = true;
      registration.abort();
      setWebmcpAvailable(false);
    };
  }, [demoState.mode, pathname]);

  useEffect(() => {
    const context = document.modelContext;
    queueMicrotask(() => setDemoToolsAvailable(false));
    if (
      !context?.registerTool ||
      demoState.mode !== 'webmcp' ||
      pathname !== '/lab'
    )
      return;
    const registration = new AbortController();
    const tools: WebMCPToolDefinition[] = [
      {
        name: 'search_demo_products',
        title: 'Search demo products',
        description:
          'Filter the synthetic catalog and update visible results. No external data or purchase is involved.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              maxLength: 120,
              description: 'Optional words to match.',
            },
            category: {
              type: 'string',
              enum: ['headphones'],
              description: 'Synthetic catalog category.',
            },
            max_price: {
              type: 'number',
              minimum: 0,
              maximum: 1000,
              description: 'Maximum price in USD.',
            },
            minimum_rating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
              description: 'Minimum rating from zero to five.',
            },
            minimum_battery_hours: {
              type: 'integer',
              minimum: 0,
              maximum: 200,
              description: 'Minimum battery hours.',
            },
            features: {
              type: 'array',
              maxItems: 4,
              uniqueItems: true,
              items: {
                type: 'string',
                enum: [
                  'noise_canceling',
                  'multipoint',
                  'spatial_audio',
                  'foldable',
                ],
              },
              description: 'Required supported features.',
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const input = exactRecord(raw, [
            'query',
            'category',
            'max_price',
            'minimum_rating',
            'minimum_battery_hours',
            'features',
          ]);
          const category = stringInput(input, 'category');
          if (category && category !== 'headphones')
            toolFailure(
              'INVALID_INPUT',
              'Only the headphones category is supported.',
            );
          const featureValue = input.features;
          if (
            featureValue !== undefined &&
            (!Array.isArray(featureValue) ||
              featureValue.length > 4 ||
              new Set(featureValue).size !== featureValue.length ||
              featureValue.some(
                (item) =>
                  typeof item !== 'string' ||
                  ![
                    'noise_canceling',
                    'multipoint',
                    'spatial_audio',
                    'foldable',
                  ].includes(item),
              ))
          )
            toolFailure(
              'INVALID_INPUT',
              'Features must contain up to four unique supported values.',
            );
          const products = actionsRef.current.searchDemoProducts(
            {
              query: stringInput(input, 'query', { max: 120 }),
              maxPrice: numberInput(input, 'max_price', { min: 0, max: 1000 }),
              minimumRating: numberInput(input, 'minimum_rating', {
                min: 0,
                max: 5,
              }),
              minimumBatteryHours: numberInput(input, 'minimum_battery_hours', {
                integer: true,
                min: 0,
                max: 200,
              }),
              features: featureValue as DemoProduct['features'] | undefined,
            },
            'tool',
          );
          return {
            count: products.length,
            visible_state_updated: true,
            products: products.map(
              ({ id, name, price, rating, batteryHours, features }) => ({
                id,
                name,
                price,
                rating,
                battery_hours: batteryHours,
                features,
              }),
            ),
          };
        },
      },
      {
        name: 'compare_demo_products',
        title: 'Compare demo products',
        description:
          'Compare two to four synthetic products by stable ID and update the visible comparison panel.',
        inputSchema: {
          type: 'object',
          properties: {
            product_ids: {
              type: 'array',
              minItems: 2,
              maxItems: 4,
              uniqueItems: true,
              items: {
                type: 'string',
                enum: DEMO_PRODUCTS.map((product) => product.id),
              },
              description: 'Two to four unique product IDs.',
            },
          },
          required: ['product_ids'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const value = exactRecord(raw, ['product_ids']).product_ids;
          if (
            !Array.isArray(value) ||
            value.length < 2 ||
            value.length > 4 ||
            new Set(value).size !== value.length ||
            value.some((item) => typeof item !== 'string')
          )
            toolFailure(
              'INVALID_INPUT',
              'product_ids must contain two to four unique strings.',
            );
          const products = actionsRef.current.compareDemoProducts(
            value as string[],
            'tool',
          );
          return {
            visible_state_updated: true,
            products: products.map(
              ({ id, name, price, rating, batteryHours }) => ({
                id,
                name,
                price,
                rating,
                battery_hours: batteryHours,
              }),
            ),
          };
        },
      },
      {
        name: 'add_demo_product_to_cart',
        title: 'Add demo product to cart',
        description:
          'Add a synthetic product to the visible demo cart. No purchase or external transaction occurs.',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              enum: DEMO_PRODUCTS.map((product) => product.id),
              description: 'Stable synthetic product ID.',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Quantity from one to five.',
            },
          },
          required: ['product_id', 'quantity'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (raw) => {
          const input = exactRecord(raw, ['product_id', 'quantity']);
          const id = stringInput(input, 'product_id', {
            required: true,
          }) as string;
          const quantity = numberInput(input, 'quantity', {
            integer: true,
            min: 1,
            max: 5,
          }) as number;
          const previous = demoRef.current.cartProductId;
          const product = actionsRef.current.addDemoProductToCart(
            id,
            quantity,
            'tool',
          );
          return {
            previous_cart_product_id: previous,
            new_cart_product_id: product.id,
            quantity,
            price: product.price,
            visible_state_updated: true,
            synthetic_only: true,
          };
        },
      },
    ];
    let cancelled = false;
    void Promise.allSettled(
      tools.map((tool) =>
        context.registerTool(
          { ...tool, execute: guardToolExecution(tool.execute) },
          { signal: registration.signal },
        ),
      ),
    ).then((results) => {
      if (
        !cancelled &&
        results.every((result) => result.status === 'fulfilled')
      ) {
        setDemoToolsAvailable(true);
      }
    });
    return () => {
      cancelled = true;
      registration.abort();
      setDemoToolsAvailable(false);
    };
  }, [demoState.mode, pathname]);

  const visibleProducts = useMemo(
    () =>
      demoState.visibleProductIds
        .map((id) => getDemoProduct(id))
        .filter((product): product is DemoProduct => Boolean(product)),
    [demoState.visibleProductIds],
  );
  const cartProduct = useMemo(
    () =>
      demoState.cartProductId ? getDemoProduct(demoState.cartProductId) : null,
    [demoState.cartProductId],
  );
  const lift = useMemo(
    () =>
      demoState.baselineRun && demoState.webmcpRun
        ? calculateLift(demoState.baselineRun, demoState.webmcpRun)
        : null,
    [demoState.baselineRun, demoState.webmcpRun],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      scanDraft: scanDraftState,
      setScanDraft,
      scanLoading,
      scanError,
      currentReport: currentReportState,
      runScan,
      setCurrentReport,
      webmcpAvailable,
      demoToolsAvailable,
      demo: demoState,
      visibleProducts,
      cartProduct,
      lift,
      selectDemoMode,
      startDemoRun,
      searchDemoProducts,
      compareDemoProducts,
      addDemoProductToCart,
      finishDemoRun,
      recordHumanIntervention,
      recordUiInteraction,
      attemptCheckout,
      runControlledComparison,
      exportPrepared,
      prepareExport,
    }),
    [
      scanDraftState,
      setScanDraft,
      scanLoading,
      scanError,
      currentReportState,
      runScan,
      setCurrentReport,
      webmcpAvailable,
      demoToolsAvailable,
      demoState,
      visibleProducts,
      cartProduct,
      lift,
      selectDemoMode,
      startDemoRun,
      searchDemoProducts,
      compareDemoProducts,
      addDemoProductToCart,
      finishDemoRun,
      recordHumanIntervention,
      recordUiInteraction,
      attemptCheckout,
      runControlledComparison,
      exportPrepared,
      prepareExport,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider.');
  return value;
}
