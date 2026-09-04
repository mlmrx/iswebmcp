import { describe, expect, it } from 'vitest';

import {
  CONTROLLED_REPLAY_FACTS,
  evaluateDemoRun,
  makeControlledRun,
} from '@/lib/demo';

const goalFilters = {
  maxPrice: 300,
  minimumRating: 4.5,
  minimumBatteryHours: 30,
  features: ['noise_canceling'] as const,
};

describe('proof-lab evidence', () => {
  it('requires search constraints and comparison before cart selection can pass', () => {
    const assertions = evaluateDemoRun([], 'aurora-q45', false, {});
    expect(
      assertions.find((item) => item.id === 'selection_sequence')?.passed,
    ).toBe(false);
    expect(
      assertions.find((item) => item.id === 'search_constraints')?.passed,
    ).toBe(false);
    expect(assertions.every((item) => item.passed)).toBe(false);
  });

  it('passes the canonical journey and keeps event-derived counts internally consistent', () => {
    const assertions = evaluateDemoRun(
      ['aurora-q45', 'sonic-arc'],
      'aurora-q45',
      false,
      {
        ...goalFilters,
        features: [...goalFilters.features],
      },
    );
    expect(assertions).toHaveLength(7);
    expect(assertions.every((item) => item.passed)).toBe(true);

    const baseline = makeControlledRun('baseline');
    const webmcp = makeControlledRun('webmcp');
    expect(baseline.uiActionCount).toBe(
      baseline.events.filter((item) => item.kind === 'ui').length,
    );
    expect(webmcp.webmcpCallCount).toBe(
      webmcp.events.filter((item) => item.kind === 'tool').length,
    );
    expect(webmcp.events.find((item) => item.id === 'w2')?.detail).toContain(
      'three eligible products',
    );
    expect(baseline.uiActionCount).toBe(
      CONTROLLED_REPLAY_FACTS.baseline.actionCount,
    );
    expect(webmcp.webmcpCallCount).toBe(
      CONTROLLED_REPLAY_FACTS.webmcp.actionCount,
    );
    expect(baseline.assertions).toHaveLength(
      CONTROLLED_REPLAY_FACTS.assertionCount,
    );
  });
});
