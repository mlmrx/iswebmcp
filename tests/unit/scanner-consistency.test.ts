import { describe, expect, it } from 'vitest';
import { cases } from '../../scripts/research/consistency-cases';
import { assess, evaluate } from '../../scripts/research/run-consistency-pilot';

describe('source consistency regression suite (not external validation)', () => {
  for (const test of cases) {
    it(test.id, () => {
      const result = evaluate(
        test,
        assess(test.before),
        assess(test.after, test.afterOptions),
      );
      expect(result.checks.filter((check) => !check.passed)).toEqual([]);
      expect(result.passed).toBe(true);
    });
  }

  it('requires actual text in ARIA names and referenced labels', () => {
    const points = (html: string) =>
      assess(html)
        .baselineActionability.categories.flatMap(
          (category) => category.metrics ?? [],
        )
        .find((metric) => metric.id === 'field-names')?.points;
    expect(points('<input aria-label="   ">')).toBe(0);
    expect(points('<label for="q">&nbsp;</label><input id="q">')).toBe(0);
    expect(points('<label><input></label>')).toBe(0);
    expect(points('<span id="a"> </span><input aria-labelledby="a">')).toBe(0);
    expect(
      points(
        '<div><span id="a">Query</span></div><input aria-labelledby="missing a">',
      ),
    ).toBe(55);
    expect(points('<input aria-labelledby="missing" aria-label="Query">')).toBe(
      55,
    );
  });
});
