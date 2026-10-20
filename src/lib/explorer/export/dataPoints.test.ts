import { describe, expect, it } from 'vitest';

import { dataPoints, exceedsLimit, exportVariableCount } from '#lib/explorer/export/dataPoints.ts';
import type { Filter } from '#lib/query/filter.svelte.ts';

const filter = (filterType: string, concepts?: string[]) =>
  ({ filterType, concepts }) as unknown as Filter;

describe('exportVariableCount', () => {
  it('counts a filter once, an any-record-of filter once per concept, and each added variable', () => {
    const filters = [
      filter('Categorical'),
      filter('numeric'),
      filter('AnyRecordOf', ['\\a\\', '\\b\\', '\\c\\']),
      filter('genomic'),
    ];

    expect(exportVariableCount(filters, 2)).toBe(1 + 1 + 3 + 1 + 2);
  });
});

describe('dataPoints', () => {
  // HPDS sizes an export as rows times row width, so the estimate multiplies; the old review-step
  // check added participants and variables and let far larger exports through.
  it('is participants times variables', () => {
    expect(dataPoints(9999, 3)).toBe(29997);
  });

  it('is unknown until the participant count is a number', () => {
    expect(dataPoints('< 10', 3)).toBeUndefined();
    expect(dataPoints(undefined, 3)).toBeUndefined();
  });
});

describe('exceedsLimit', () => {
  it('is over only above the limit', () => {
    expect(exceedsLimit(1000, 1000)).toBe(false);
    expect(exceedsLimit(1001, 1000)).toBe(true);
  });

  it('treats an unknown size as over the limit', () => {
    expect(exceedsLimit(undefined, 1000)).toBe(true);
  });
});
