import { describe, it, expect } from 'vitest';

import {
  appendClauses,
  createQuery,
  parseQuery,
  toQueryJson,
  type PhenotypicFilter,
} from '#lib/query/query.ts';

const filter = (conceptPath: string): PhenotypicFilter => ({
  type: 'PhenotypicFilter',
  phenotypicFilterType: 'REQUIRED',
  conceptPath,
  not: false,
});

describe('query wire form', () => {
  const query = createQuery({
    select: ['\\s\\'],
    phenotypicClause: {
      type: 'PhenotypicSubquery',
      operator: 'AND',
      phenotypicClauses: [
        { ...filter('\\n\\'), phenotypicFilterType: 'FILTER', min: 1, max: 2 },
        {
          type: 'PhenotypicSubquery',
          operator: 'OR',
          phenotypicClauses: [filter('\\a\\'), filter('\\b\\')],
          not: false,
        },
      ],
      not: false,
    },
    genomicFilters: [{ key: 'Gene_with_variant', values: ['BRCA1'] }],
  });

  it('drops the type tags', () => {
    expect(JSON.stringify(toQueryJson(query))).not.toContain('"type"');
  });

  // Saved and exported queries are re-sent after a parse; the bytes must not change.
  it('parses back to a query that serialises to the same bytes', () => {
    const json = toQueryJson(query);

    expect(JSON.stringify(toQueryJson(parseQuery(json)))).toBe(JSON.stringify(json));
  });

  it('reads the explicit nulls the API echoes back as unset', () => {
    const parsed = parseQuery({
      phenotypicClause: { ...filter('\\a\\'), values: null, min: null, max: null },
      genomicFilters: [{ key: 'k', values: ['v'], min: null, max: null } as never],
    });

    expect(parsed.phenotypicClause).toEqual(filter('\\a\\'));
    expect(parsed.genomicFilters).toEqual([{ key: 'k', values: ['v'] }]);
  });
});

describe('appendClauses', () => {
  it('starts with the first clause, then groups a lone filter with the next', () => {
    const root = appendClauses(null, [filter('\\a\\'), filter('\\b\\'), filter('\\c\\')]);

    expect(root).toEqual({
      type: 'PhenotypicSubquery',
      phenotypicClauses: [filter('\\a\\'), filter('\\b\\'), filter('\\c\\')],
      operator: 'AND',
      not: false,
    });
  });

  it('adds to an existing group without mutating it', () => {
    const group = appendClauses(null, [filter('\\a\\'), filter('\\b\\')])!;
    const before = structuredClone(group);

    const root = appendClauses(group, [filter('\\c\\')], 'OR');

    expect(group).toEqual(before);
    expect(root).toMatchObject({ operator: 'AND', phenotypicClauses: [{}, {}, {}] });
  });
});
