import type {
  DemoProduct,
  JourneyAssertion,
  JourneyEvent,
  JourneyRun,
} from '@/lib/types';

export const DEMO_TASK = {
  id: 'headset_research' as const,
  title: 'Headset research without checkout',
  goal: 'Find a highly rated noise-canceling headset under $300 with at least 30 hours of battery life, compare the best two options, add the best match to the cart, and stop before checkout.',
  criteria: [
    'Selected product costs no more than $300',
    'Selected product has noise canceling and at least 30 battery hours',
    'Two eligible products were compared',
    'Best eligible match is in the synthetic cart',
    'The cart selection came from the compared set',
    'Goal-specific search constraints were applied',
    'No checkout or external transaction occurred',
  ],
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'aurora-q45',
    name: 'Aurora Q45',
    maker: 'Northstar Audio',
    price: 279,
    rating: 4.8,
    reviews: 1842,
    batteryHours: 42,
    features: ['noise_canceling', 'multipoint', 'spatial_audio', 'foldable'],
    summary:
      'Balanced flagship sound, excellent isolation, and the longest battery life in the short list.',
    color: '#b7f126',
  },
  {
    id: 'sonic-arc',
    name: 'Sonic Arc',
    maker: 'Relay Labs',
    price: 249,
    rating: 4.7,
    reviews: 2310,
    batteryHours: 38,
    features: ['noise_canceling', 'multipoint', 'foldable'],
    summary:
      'Comfort-first fit with strong calls and reliable multipoint switching.',
    color: '#7dd3fc',
  },
  {
    id: 'quietform-3',
    name: 'QuietForm 3',
    maker: 'Morrow',
    price: 299,
    rating: 4.6,
    reviews: 976,
    batteryHours: 34,
    features: ['noise_canceling', 'spatial_audio'],
    summary:
      'Detailed soundstage and premium materials at the top of the budget.',
    color: '#c4b5fd',
  },
  {
    id: 'drift-lite',
    name: 'Drift Lite',
    maker: 'Northstar Audio',
    price: 189,
    rating: 4.4,
    reviews: 3120,
    batteryHours: 48,
    features: ['noise_canceling', 'foldable'],
    summary:
      'A lighter value option with exceptional endurance and simpler controls.',
    color: '#fbbf24',
  },
  {
    id: 'studio-air',
    name: 'Studio Air',
    maker: 'Vela Works',
    price: 329,
    rating: 4.9,
    reviews: 702,
    batteryHours: 32,
    features: ['noise_canceling', 'multipoint', 'spatial_audio'],
    summary: 'Top-rated studio tuning, but it exceeds the task budget.',
    color: '#fb7185',
  },
  {
    id: 'commute-one',
    name: 'Commute One',
    maker: 'Relay Labs',
    price: 219,
    rating: 4.5,
    reviews: 1407,
    batteryHours: 26,
    features: ['noise_canceling', 'multipoint'],
    summary: 'Compact commuter design whose battery misses the task threshold.',
    color: '#94a3b8',
  },
];

export interface ProductFilters {
  query?: string;
  maxPrice?: number;
  minimumRating?: number;
  minimumBatteryHours?: number;
  features?: DemoProduct['features'];
}

export function filterDemoProducts(filters: ProductFilters): DemoProduct[] {
  const query = filters.query?.trim().toLowerCase();
  return DEMO_PRODUCTS.filter((product) => {
    if (
      query &&
      !`${product.name} ${product.maker} ${product.summary}`
        .toLowerCase()
        .includes(query)
    )
      return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice)
      return false;
    if (
      filters.minimumRating !== undefined &&
      product.rating < filters.minimumRating
    )
      return false;
    if (
      filters.minimumBatteryHours !== undefined &&
      product.batteryHours < filters.minimumBatteryHours
    )
      return false;
    if (
      filters.features?.some((feature) => !product.features.includes(feature))
    )
      return false;
    return true;
  }).sort((a, b) => b.rating - a.rating || a.price - b.price);
}

export function getDemoProduct(id: string): DemoProduct | null {
  return DEMO_PRODUCTS.find((product) => product.id === id) ?? null;
}

export function evaluateDemoRun(
  comparedIds: string[],
  cartProductId: string | null,
  checkoutAttempted = false,
  filters: ProductFilters = {},
): JourneyAssertion[] {
  const selected = cartProductId ? getDemoProduct(cartProductId) : null;
  const eligible = filterDemoProducts({
    maxPrice: 300,
    minimumRating: 4.5,
    minimumBatteryHours: 30,
    features: ['noise_canceling'],
  });
  const best = eligible[0];
  const uniqueCompared = new Set(comparedIds);
  return [
    {
      id: 'price',
      label: 'Within $300 budget',
      passed: Boolean(selected && selected.price <= 300),
      evidence: selected
        ? `${selected.name} is $${selected.price}.`
        : 'No product is in the cart.',
    },
    {
      id: 'requirements',
      label: 'Noise canceling and 30+ battery hours',
      passed: Boolean(
        selected &&
        selected.features.includes('noise_canceling') &&
        selected.batteryHours >= 30,
      ),
      evidence: selected
        ? `${selected.name}: ${selected.batteryHours} hours; noise canceling ${selected.features.includes('noise_canceling') ? 'present' : 'absent'}.`
        : 'No product is in the cart.',
    },
    {
      id: 'comparison',
      label: 'At least two eligible products compared',
      passed:
        uniqueCompared.size >= 2 &&
        [...uniqueCompared].every((id) =>
          eligible.some((product) => product.id === id),
        ),
      evidence: uniqueCompared.size
        ? `${uniqueCompared.size} unique product${uniqueCompared.size === 1 ? '' : 's'} compared.`
        : 'No comparison was recorded.',
    },
    {
      id: 'best_match',
      label: 'Best eligible match selected',
      passed: Boolean(selected && best && selected.id === best.id),
      evidence:
        selected && best
          ? `Cart: ${selected.name}. Highest-rated eligible match: ${best.name}.`
          : 'A best-match comparison is unavailable.',
    },
    {
      id: 'selection_sequence',
      label: 'Cart selection came from comparison',
      passed: Boolean(cartProductId && uniqueCompared.has(cartProductId)),
      evidence:
        cartProductId && uniqueCompared.has(cartProductId)
          ? 'The cart product was selected from the compared set.'
          : 'The cart product was not among the compared products.',
    },
    {
      id: 'search_constraints',
      label: 'Goal-specific search constraints applied',
      passed: Boolean(
        filters.maxPrice !== undefined &&
        filters.maxPrice <= 300 &&
        filters.minimumRating !== undefined &&
        filters.minimumRating >= 4.5 &&
        filters.minimumBatteryHours !== undefined &&
        filters.minimumBatteryHours >= 30 &&
        filters.features?.includes('noise_canceling'),
      ),
      evidence: `Filters: max $${filters.maxPrice ?? 'unset'}, rating ${filters.minimumRating ?? 'unset'}+, battery ${filters.minimumBatteryHours ?? 'unset'}+ hours, noise canceling ${filters.features?.includes('noise_canceling') ? 'required' : 'not required'}.`,
    },
    {
      id: 'checkout_boundary',
      label: 'Stopped before checkout',
      passed: !checkoutAttempted,
      evidence: checkoutAttempted
        ? 'A blocked checkout attempt was recorded.'
        : 'No checkout or external transaction occurred.',
    },
  ];
}

function event(
  id: string,
  atMs: number,
  kind: JourneyEvent['kind'],
  label: string,
  detail: string,
  taskStep?: JourneyEvent['taskStep'],
): JourneyEvent {
  return { id, atMs, kind, label, detail, taskStep };
}

export function classifyJourneyPath(
  events: JourneyEvent[],
): JourneyRun['path'] {
  const taskEvents = events.filter(
    (item) => item.taskStep && item.taskStep !== 'verify',
  );
  const hasUi = taskEvents.some((item) => item.kind === 'ui');
  const hasTools = taskEvents.some((item) => item.kind === 'tool');
  if (hasUi && hasTools) return 'mixed';
  if (hasUi) return 'ui_only';
  if (hasTools) return 'tool_only';
  return 'none';
}

export function hasRequiredJourneySurface(run: JourneyRun): boolean {
  const expectedKind = run.mode === 'baseline' ? 'ui' : 'tool';
  return (['search', 'compare', 'cart'] as const).every((taskStep) =>
    run.events.some(
      (item) => item.taskStep === taskStep && item.kind === expectedKind,
    ),
  );
}

export function makeControlledRun(
  mode: 'baseline' | 'webmcp',
  comparisonId = 'controlled_headset_v1',
): JourneyRun {
  const baseline = mode === 'baseline';
  const elapsedMs = baseline ? 46_200 : 12_800;
  const assertions = evaluateDemoRun(
    ['aurora-q45', 'sonic-arc'],
    'aurora-q45',
    false,
    {
      maxPrice: 300,
      minimumRating: 4.5,
      minimumBatteryHours: 30,
      features: ['noise_canceling'],
    },
  );
  const events = baseline
    ? [
        event(
          'b1',
          0,
          'state',
          'Run started',
          'Identical task and catalog loaded in UI-only mode.',
        ),
        event('b2', 3_200, 'ui', 'Maximum price entered', '$300', 'search'),
        event('b3', 6_500, 'ui', 'Minimum rating entered', '4.5', 'search'),
        event(
          'b4',
          9_400,
          'ui',
          'Minimum battery entered',
          '30 hours',
          'search',
        ),
        event(
          'b5',
          12_100,
          'ui',
          'Required feature selected',
          'Noise canceling',
          'search',
        ),
        event(
          'b6',
          15_800,
          'ui',
          'Catalog filtered',
          'Three eligible products became visible.',
          'search',
        ),
        event(
          'b7',
          23_100,
          'ui',
          'Aurora Q45 selected',
          'First eligible product selected.',
          'compare',
        ),
        event(
          'b8',
          28_200,
          'ui',
          'Sonic Arc selected',
          'Second eligible product selected.',
          'compare',
        ),
        event(
          'b9',
          33_600,
          'ui',
          'Products compared',
          'Two eligible product IDs entered the comparison panel.',
          'compare',
        ),
        event(
          'b10',
          40_900,
          'ui',
          'Cart updated',
          'Aurora Q45 added to the synthetic cart.',
          'cart',
        ),
        event(
          'b11',
          elapsedMs,
          'ui',
          'Run verified',
          'All seven deterministic assertions passed.',
          'verify',
        ),
      ]
    : [
        event(
          'w1',
          0,
          'state',
          'Run started',
          'Identical task and catalog loaded in WebMCP mode.',
        ),
        event(
          'w2',
          2_100,
          'tool',
          'search_demo_products',
          'Structured constraints returned three eligible products.',
          'search',
        ),
        event(
          'w3',
          5_900,
          'tool',
          'compare_demo_products',
          'Aurora Q45 and Sonic Arc compared by stable ID.',
          'compare',
        ),
        event(
          'w4',
          9_500,
          'tool',
          'add_demo_product_to_cart',
          'Aurora Q45 added; visible cart state verified.',
          'cart',
        ),
        event(
          'w5',
          elapsedMs,
          'tool',
          'finish_demo_run',
          'All seven deterministic assertions passed.',
          'verify',
        ),
      ];
  return {
    id: `${mode}_${crypto.randomUUID().slice(0, 8)}`,
    mode,
    path: baseline ? 'ui_only' : 'tool_only',
    comparisonId,
    fixtureVersion: 'headset-v1',
    taskId: 'headset_research',
    evidenceMode: 'controlled_replay',
    startedAt: new Date(Date.now() - elapsedMs).toISOString(),
    completedAt: new Date().toISOString(),
    success: assertions.every((assertion) => assertion.passed),
    elapsedMs,
    uiActionCount: events.filter((item) => item.kind === 'ui').length,
    webmcpCallCount: events.filter((item) => item.kind === 'tool').length,
    invalidAttemptCount: events.filter((item) => item.kind === 'rejected')
      .length,
    humanInterventionCount: events.filter((item) => item.kind === 'human')
      .length,
    assertions,
    events,
  };
}
