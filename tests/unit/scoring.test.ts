import { describe, expect, it } from 'vitest';

import { makeControlledRun } from '@/lib/demo';
import { calculateLift, calculateWeightedScore } from '@/lib/scoring';
import type { JourneyRun } from '@/lib/types';

describe('weighted evidence score', () => {
  it('renormalizes observed evidence and keeps coverage visible', () => {
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
});

describe('WebMCP Lift', () => {
  it('calculates positive lift from comparable observed runs', () => {
    const result = calculateLift(
      makeControlledRun('baseline'),
      makeControlledRun('webmcp'),
    );
    expect(result.value).toBeGreaterThan(20);
    expect(result.value).toBeLessThanOrEqual(100);
  });

  it('can be negative', () => {
    const baseline = makeControlledRun('baseline');
    const webmcp: JourneyRun = {
      ...makeControlledRun('webmcp'),
      elapsedMs: baseline.elapsedMs * 2,
      webmcpCallCount: 25,
      invalidAttemptCount: 4,
      humanInterventionCount: 3,
    };
    expect(calculateLift(baseline, webmcp).value).toBeLessThan(0);
  });

  it('does not reward a fast failed run for efficiency', () => {
    const baseline = makeControlledRun('baseline');
    const failed: JourneyRun = {
      ...makeControlledRun('webmcp'),
      success: false,
      elapsedMs: 1,
      assertions: makeControlledRun('webmcp').assertions.map((assertion) => ({
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
    const baseline = makeControlledRun('baseline');
    const mismatched = {
      ...makeControlledRun('webmcp'),
      comparisonId: 'different-pair',
    };
    expect(calculateLift(baseline, mismatched).value).toBeNull();

    const mixed: JourneyRun = {
      ...makeControlledRun('webmcp', baseline.comparisonId),
      path: 'mixed',
    };
    expect(calculateLift(baseline, mixed).value).toBeNull();
  });
});
