import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import { LogicTree } from '$lib/models/LogicTree.svelte';
import { createFilterGroup, type FilterInterface, type Filter } from '$lib/models/Filter.svelte';
import {
  buildDescriptor,
  stableHash,
  type QueryDescriptor,
} from '$lib/services/counts/queryDescriptor.svelte';

function makeEmptyTree(): LogicTree<FilterInterface> {
  return new LogicTree<FilterInterface>(createFilterGroup);
}

describe('buildDescriptor', () => {
  it('returns a descriptor with isOpenAccess and a null phenotypicClause for empty filters', () => {
    const d = buildDescriptor({
      isOpenAccess: true,
      filterTree: makeEmptyTree(),
      genomicFilters: [],
    });
    expect(d.isOpenAccess).toBe(true);
    expect(d.phenotypicClause).toBeNull();
    expect(d.genomicFilters).toEqual([]);
  });

  it('builds a phenotypicClause from a non-empty filterTree', () => {
    const tree = makeEmptyTree();
    const filter = {
      id: '\\demographics\\AGE\\',
      filterType: 'numeric',
      min: '10',
      max: '20',
    } as unknown as FilterInterface;
    tree.root.children.push(filter);
    const d = buildDescriptor({
      isOpenAccess: false,
      filterTree: tree,
      genomicFilters: [],
    });
    expect(d.phenotypicClause).not.toBeNull();
  });

  it("detaches the phenotypicClause from the source filter store — mutating a Categorical filter's categoryValues after build does NOT affect the descriptor", () => {
    const tree = makeEmptyTree();
    const categoryValues = ['male'];
    const filter = {
      id: '\\nhanes\\sex\\',
      filterType: 'Categorical',
      categoryValues,
    } as unknown as FilterInterface;
    tree.root.children.push(filter);

    const d = buildDescriptor({
      isOpenAccess: false,
      filterTree: tree,
      genomicFilters: [],
    });
    categoryValues.push('female');

    const clause = d.phenotypicClause as { phenotypicClauses?: { values?: string[] }[] };
    const leafValues = clause?.phenotypicClauses?.[0]?.values;
    expect(leafValues).toEqual(['male']);
  });

  it('serializes snp filters into genomicFilters', () => {
    const snp = {
      filterType: 'snp',
      snpValues: [{ search: 'rs123', constraint: 'A,C' }],
    } as unknown as Filter;
    const d = buildDescriptor({
      isOpenAccess: false,
      filterTree: makeEmptyTree(),
      genomicFilters: [snp],
    });
    expect(d.genomicFilters).toEqual([{ key: 'rs123', values: ['A', 'C'] }]);
  });
});

describe('stableHash', () => {
  const base: QueryDescriptor = {
    isOpenAccess: true,
    phenotypicClause: null,
    genomicFilters: [],
  };

  it('produces a deterministic string for the same descriptor', () => {
    expect(stableHash(base)).toBe(stableHash(base));
  });

  it('produces the same hash regardless of property insertion order', () => {
    const a: QueryDescriptor = { ...base };
    const b: QueryDescriptor = {
      genomicFilters: [],
      phenotypicClause: null,
      isOpenAccess: true,
    } as QueryDescriptor;
    expect(stableHash(a)).toBe(stableHash(b));
  });

  it('differs when isOpenAccess differs', () => {
    expect(stableHash(base)).not.toBe(stableHash({ ...base, isOpenAccess: false }));
  });

  it('differs when phenotypicClause differs', () => {
    const withClause: QueryDescriptor = {
      ...base,
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'REQUIRED',
        conceptPath: '\\x\\',
        not: false,
      },
    };
    expect(stableHash(base)).not.toBe(stableHash(withClause));
  });

  it('differs when genomicFilters differ', () => {
    const withGenomic: QueryDescriptor = {
      ...base,
      genomicFilters: [{ key: 'rs1', values: ['A'] }],
    };
    expect(stableHash(base)).not.toBe(stableHash(withGenomic));
  });

  it('omits undefined-valued object keys so a numeric clause with min=undefined hashes the same as one that omits min entirely', () => {
    const withUndefinedMin: QueryDescriptor = {
      ...base,
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\age\\',
        not: false,
        min: undefined,
        max: 18,
      },
    };
    const withoutMinKey: QueryDescriptor = {
      ...base,
      phenotypicClause: {
        type: 'PhenotypicFilter',
        phenotypicFilterType: 'FILTER',
        conceptPath: '\\age\\',
        not: false,
        max: 18,
      },
    };
    expect(stableHash(withUndefinedMin)).toBe(stableHash(withoutMinKey));
  });
});
