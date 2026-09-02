import { describe, expect, it } from 'vitest';

import { makeControlledRun } from '@/lib/demo';
import { calculateLift, calculateWeightedScore } from '@/lib/scoring';
import type { JourneyRun } from '@/lib/types';

describe('weighted evidence score', () => {
  it('keeps the observed estimate and publishes an unknown-evidence interval', () => {
    const score = calculateWeightedScore([
      {
        id: 'a',
        label: 'A',
        weight: 60,
        score: 80,
        status: 'pass',
        explanation: '',
      },
      {
        id: 'b',
        label: 'B',
        weight: 40,
        score: null,
        status: 'not_observed',
        explanation: '',
      },
    ]);
    expect(score.value).toBe(80);
    expect(score.coverage).toBe(60);
    expect(score.interval).toEqual({ lower: 48, upper: 88 });
  });

  it('returns N/A when every category is unknown', () => {
    const score = calculateWeightedScore([
      {
        id: 'a',
        label: 'A',
        weight: 100,
        score: null,
        status: 'not_observed',
        explanation: '',
      },
    ]);
    expect(score.value).toBeNull();
    expect(score.coverage).toBe(0);
  });

  it('weights coverage by observed metric possible-points', () => {
    const score = calculateWeightedScore([
      {
        id: 'partial-category',
        label: 'Partial category',
        weight: 100,
        score: 100,
        status: 'pass',
        explanation: '',
        metrics: [
          {
            id: 'observed',
            label: 'Observed',
            observed: true,
            value: 'present',
            points: 30,
            possible: 30,
            rationale: '',
          },
          {
            id: 'unknown',
            label: 'Unknown',
            observed: false,
            value: 'not observed',
            points: 0,
            possible: 70,
            rationale: '',
          },
        ],
      },
    ]);

    expect(score.value).toBe(100);
    expect(score.coverage).toBe(30);
    expect(score.interval).toEqual({ lower: 30, upper: 100 });
  });

  it('publishes only an unknown full-result range when requested', () => {
    const score = calculateWeightedScore(
      [
        {
          id: 'captured',
          label: 'Captured prefix',
          weight: 100,
          score: 80,
          status: 'pass',
          explanation: '',
        },
      ],
      { fullResultUnknown: true },
    );

    expect(score.value).toBe(80);
    expect(score.coverage).toBe(100);
    expect(score.interval).toEqual({ lower: 0, upper: 100 });
  });
});

describe('WebMCP Lift', () => {
  const observedRun = (mode: 'baseline' | 'webmcp') => ({
    ...makeControlledRun(mode),
    evidenceMode: 'interactive' as const,
  });

  it('calculates positive lift from comparable observed runs', () => {
    const result = calculateLift(
      observedRun('baseline'),
      observedRun('webmcp'),
    );
    expect(result.value).toBeGreaterThan(20);
    expect(result.value).toBeLessThanOrEqual(100);
  });

  it('can be negative', () => {
    const baseline = observedRun('baseline');
    const webmcp: JourneyRun = {
      ...observedRun('webmcp'),
      elapsedMs: baseline.elapsedMs * 2,
      webmcpCallCount: 25,
      invalidAttemptCount: 4,
      humanInterventionCount: 3,
    };
    expect(calculateLift(baseline, webmcp).value).toBeLessThan(0);
  });

  it('does not reward a fast failed run for efficiency', () => {
    const baseline = observedRun('baseline');
    const failed: JourneyRun = {
      ...observedRun('webmcp'),
      success: false,
      elapsedMs: 1,
      assertions: observedRun('webmcp').assertions.map((assertion) => ({
        ...assertion,
        passed: false,
      })),
    };
    const result = calculateLift(baseline, failed);
    expect(
      result.components.find((item) => item.id === 'elapsed')?.comparable,
    ).toBe(false);
    expect(result.value).toBeLessThan(0);
  });

  it('withholds lift for mismatched or mixed-path runs', () => {
    const baseline = observedRun('baseline');
    const mismatched = {
      ...observedRun('webmcp'),
      comparisonId: 'different-pair',
    };
    const mismatchedResult = calculateLift(baseline, mismatched);
    expect(mismatchedResult.value).toBeNull();
    expect(
      mismatchedResult.components.every(
        (component) =>
          component.value === null && component.contribution === null,
      ),
    ).toBe(true);

    const mixed: JourneyRun = {
      ...observedRun('webmcp'),
      comparisonId: baseline.comparisonId,
      path: 'mixed',
    };
    expect(calculateLift(baseline, mixed).value).toBeNull();
  });

  it('withholds numeric lift for authored controlled replays', () => {
    const result = calculateLift(
      makeControlledRun('baseline'),
      makeControlledRun('webmcp'),
    );
    expect(result.value).toBeNull();
    expect(result.interpretation).toBe('Illustrative replay — lift withheld');
    expect(result.limitation).toContain('No agent trial occurred');
    expect(
      result.components.every(
        (component) =>
          component.value === null && component.contribution === null,
      ),
    ).toBe(true);
  });
});
