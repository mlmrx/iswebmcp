import type {
  JourneyRun,
  LiftComponent,
  LiftResult,
  ScoreCategory,
  WeightedScore,
} from '@/lib/types';
import { hasRequiredJourneySurface } from '@/lib/demo';

const clamp = (value: number, min = -1, max = 1) =>
  Math.min(max, Math.max(min, value));

export function calculateWeightedScore(
  categories: ScoreCategory[],
  options: {
    fullResultUnknown?: boolean;
    modelVersion?: string;
    confidence?: WeightedScore['confidence'];
    coverageNote?: string;
  } = {},
): WeightedScore {
  const totalWeight = categories.reduce(
    (total, category) => total + category.weight,
    0,
  );
  const observed = categories
    .filter((category) => category.score !== null)
    .map((category) => {
      const totalPossible =
        category.metrics?.reduce(
          (total, metric) => total + Math.max(0, metric.possible),
          0,
        ) ?? 0;
      const observedPossible =
        category.metrics?.reduce(
          (total, metric) =>
            total + (metric.observed ? Math.max(0, metric.possible) : 0),
          0,
        ) ?? 0;
      const observedFraction = totalPossible
        ? observedPossible / totalPossible
        : 1;
      return {
        category,
        effectiveWeight: category.weight * observedFraction,
      };
    });
  const observedWeight = observed.reduce(
    (total, item) => total + item.effectiveWeight,
    0,
  );

  if (observedWeight === 0) {
    return {
      value: null,
      coverage: 0,
      categories,
      modelVersion: options.modelVersion,
      confidence: options.confidence,
      coverageNote: options.coverageNote,
    };
  }

  const weightedValue = observed.reduce(
    (total, item) =>
      total + item.effectiveWeight * (item.category.score as number),
    0,
  );
  const interval = totalWeight
    ? options.fullResultUnknown
      ? { lower: 0, upper: 100 }
      : {
          lower: Math.round(weightedValue / totalWeight),
          upper: Math.round(
            (weightedValue + (totalWeight - observedWeight) * 100) /
              totalWeight,
          ),
        }
    : undefined;

  return {
    value: Math.round(weightedValue / observedWeight),
    coverage: totalWeight
      ? Math.round((observedWeight / totalWeight) * 100)
      : 0,
    interval,
    categories,
    modelVersion: options.modelVersion,
    confidence: options.confidence,
    coverageNote: options.coverageNote,
  };
}

export function ratioReduction(baseline: number, webmcp: number): number {
  return clamp((baseline - webmcp) / Math.max(baseline, webmcp, 1));
}

function assertionPassRate(run: JourneyRun): number {
  if (!run.assertions.length) return 0;
  return (
    run.assertions.filter((assertion) => assertion.passed).length /
    run.assertions.length
  );
}

export function calculateLift(
  baseline: JourneyRun,
  webmcp: JourneyRun,
): LiftResult {
  const pathsComparable =
    baseline.mode === 'baseline' &&
    webmcp.mode === 'webmcp' &&
    baseline.taskId === webmcp.taskId &&
    baseline.fixtureVersion === webmcp.fixtureVersion &&
    baseline.comparisonId === webmcp.comparisonId &&
    baseline.evidenceMode === webmcp.evidenceMode &&
    Boolean(baseline.completedAt && webmcp.completedAt) &&
    baseline.path === 'ui_only' &&
    webmcp.path === 'tool_only' &&
    hasRequiredJourneySurface(baseline) &&
    hasRequiredJourneySurface(webmcp);
  const bothSucceeded = baseline.success && webmcp.success;
  const successDelta = Number(webmcp.success) - Number(baseline.success);
  const efficiency = (base: number, web: number) =>
    bothSucceeded ? ratioReduction(base, web) : 0;
  const verificationDelta =
    assertionPassRate(webmcp) - assertionPassRate(baseline);

  const rawComponents = [
    ['success', 'Task success', 0.4, successDelta, pathsComparable],
    [
      'actions',
      'Action count',
      0.2,
      efficiency(
        baseline.uiActionCount + baseline.webmcpCallCount,
        webmcp.uiActionCount + webmcp.webmcpCallCount,
      ),
      pathsComparable && bothSucceeded,
    ],
    [
      'elapsed',
      'Elapsed time',
      0.15,
      efficiency(baseline.elapsedMs, webmcp.elapsedMs),
      pathsComparable && bothSucceeded,
    ],
    [
      'invalid',
      'Invalid attempts',
      0.1,
      efficiency(baseline.invalidAttemptCount, webmcp.invalidAttemptCount),
      pathsComparable && bothSucceeded,
    ],
    [
      'human',
      'Human intervention',
      0.1,
      efficiency(
        baseline.humanInterventionCount,
        webmcp.humanInterventionCount,
      ),
      pathsComparable && bothSucceeded,
    ],
    ['verification', 'Verification', 0.05, verificationDelta, pathsComparable],
  ] as const;

  const includesControlledReplay =
    baseline.evidenceMode === 'controlled_replay' ||
    webmcp.evidenceMode === 'controlled_replay';
  const withholdComponentNumbers = includesControlledReplay || !pathsComparable;
  const components: LiftComponent[] = rawComponents.map(
    ([id, label, weight, value, comparable]) =>
      withholdComponentNumbers
        ? {
            id,
            label,
            weight,
            value: null,
            contribution: null,
            comparable: false,
          }
        : {
            id,
            label,
            weight,
            value,
            contribution: weight * value,
            comparable,
          },
  );

  const value =
    pathsComparable && !includesControlledReplay
      ? Math.round(
          100 *
            components.reduce(
              (sum, component) => sum + (component.contribution ?? 0),
              0,
            ),
        )
      : null;

  const interpretation = includesControlledReplay
    ? 'Illustrative replay — lift withheld'
    : value === null
      ? 'Not comparable'
      : value >= 50
        ? 'Transformative improvement'
        : value >= 20
          ? 'Meaningful improvement'
          : value > 0
            ? 'Marginal improvement'
            : value === 0
              ? 'No measured improvement'
              : 'The WebMCP path made this journey worse';

  return {
    value: value === null ? null : clamp(value, -100, 100),
    interpretation,
    components,
    baseline,
    webmcp,
    limitation: includesControlledReplay
      ? 'The replay timeline and timing are authored to explain the comparison model. No agent trial occurred, so isWebMCP withholds a numeric Lift score.'
      : !pathsComparable
        ? 'Lift is withheld: runs must be a completed, intentionally paired fixture; baseline must use only UI, WebMCP must use only tools, and both must exercise search, compare, and cart.'
        : 'Results describe these two observed runs only and do not establish universal agent performance.',
  };
}
