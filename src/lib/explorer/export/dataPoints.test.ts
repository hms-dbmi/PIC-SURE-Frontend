import { describe, expect, it } from 'vitest';

import { checkSize, dataPoints, exportVariableCount } from '#lib/explorer/export/dataPoints.ts';
import type { Filter } from '#lib/query/filter.svelte.ts';

const filter = (filterType: string, concepts?: string[]) =>
  ({ filterType, concepts }) as unknown as Filter;

describe('exportVariableCount', () => {
  it('counts a filter once, an any-record-of filter once per concept, and each added variable', () => {
    const filters = [
      filter('Categorical'),
      filter('numeric'),
      filter('AnyRecordOf', ['\\a\\', '\\b\\', '\\c\\']),
    ];

    expect(exportVariableCount(filters, 2)).toBe(1 + 1 + 3 + 2);
  });
});

describe('dataPoints', () => {
  it('is participants times variables', () => {
    expect(dataPoints(9999, 3)).toBe(29997);
  });

  it('is unknown until the participant count is a number', () => {
    expect(dataPoints('< 10', 3)).toBeUndefined();
    expect(dataPoints(undefined, 3)).toBeUndefined();
  });
});

describe('checkSize', () => {
  const counted = { pending: false, failed: false };

  it('is over only above the limit', () => {
    expect(checkSize(counted, 1000, 1000)).toBe('ok');
    expect(checkSize(counted, 1001, 1000)).toBe('over');
  });

  it('waits for the participant count', () => {
    expect(checkSize({ pending: true, failed: false }, 0, 1000)).toBe('pending');
  });

  it('is unknown when the count failed or is not a number', () => {
    expect(checkSize({ pending: false, failed: true }, 0, 1000)).toBe('unknown');
    expect(checkSize(counted, undefined, 1000)).toBe('unknown');
  });
});
