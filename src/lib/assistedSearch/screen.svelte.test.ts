import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadQuerySummaryData, fakeSearch } = vi.hoisted(() => {
  const fakeSearch = {
    term: '',
    selectedFacets: [] as unknown[],
    facetCategories: undefined as unknown,
    setTerm: (term: string) => void (fakeSearch.term = term),
    setFacets: (facets: unknown[]) => void (fakeSearch.selectedFacets = facets),
  };
  return { loadQuerySummaryData: vi.fn(), fakeSearch };
});

vi.mock('#lib/query/restore.ts', () => ({ loadQuerySummaryData }));
vi.mock('#lib/explorer/search.svelte.ts', () => ({ explorerSearch: fakeSearch }));

import { applyScreen, readScreen } from './screen.svelte.ts';
import { exportState, mapSearchResultAsExport } from '#lib/explorer/index.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { createFilterGroup, createRequiredFilter } from '#lib/query/filter.svelte.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

const result = (conceptPath: string) =>
  ({ conceptPath, dataset: 'ds', name: 'n', display: 'n', type: 'Categorical' }) as SearchResult;

function loaded(over: { errors?: string[] } = {}) {
  const tree = new LogicTree(createFilterGroup);
  tree.add(createRequiredFilter(result('\\ds\\sex\\')));
  return {
    filterTree: Promise.resolve(tree),
    genomicFilters: Promise.resolve([]),
    exports: Promise.resolve([result('\\ds\\age\\')]),
    errors: Promise.resolve(over.errors ?? []),
  };
}

beforeEach(() => {
  exportState.clear();
  filterState.reset();
  fakeSearch.term = '';
  fakeSearch.selectedFacets = [];
  fakeSearch.facetCategories = undefined;
  loadQuerySummaryData.mockReset();
});

describe('readScreen', () => {
  it('describes the filters, selected variables, facets and search as the service expects', () => {
    filterState.add(createRequiredFilter(result('\\ds\\sex\\')));
    exportState.add(mapSearchResultAsExport(result('\\ds\\age\\')));
    fakeSearch.selectedFacets = [
      { category: 'study', name: 'NHANES', display: 'NHANES', description: null, count: 3 },
    ];
    fakeSearch.term = 'bmi';

    const screen = readScreen();
    expect(screen.query.select).toEqual(['\\ds\\age\\']);
    expect(screen.query.phenotypicClause).toMatchObject({
      type: 'PhenotypicSubquery',
      phenotypicClauses: [{ phenotypicFilterType: 'REQUIRED', conceptPath: '\\ds\\sex\\' }],
    });
    expect(screen.facets).toEqual([{ category: 'study', name: 'NHANES' }]);
    expect(screen.search).toBe('bmi');
  });
});

describe('applyScreen', () => {
  it('sets only the parts it is given', async () => {
    fakeSearch.term = 'keep';
    await applyScreen({ facets: [{ category: 'study', name: 'NHANES' }] });
    expect(fakeSearch.term).toBe('keep');
    expect(fakeSearch.selectedFacets).toMatchObject([{ category: 'study', name: 'NHANES' }]);
    expect(loadQuerySummaryData).not.toHaveBeenCalled();
  });

  it('uses the facets on screen for display and counts', async () => {
    fakeSearch.facetCategories = [
      {
        name: 'study',
        display: 'Study',
        description: '',
        facets: [
          {
            name: 'NHANES',
            display: 'NHANES study',
            description: null,
            count: 9,
            category: 'study',
          },
        ],
      },
    ];
    await applyScreen({ facets: [{ category: 'study', name: 'NHANES' }] });
    expect(fakeSearch.selectedFacets).toMatchObject([{ display: 'NHANES study', count: 9 }]);
  });

  it('turns a returned query into the filter tree and selected variables', async () => {
    loadQuerySummaryData.mockReturnValue(loaded());
    await applyScreen({
      query: { select: ['\\ds\\age\\'], phenotypicClause: null, genomicFilters: [] },
    });
    expect(filterState.phenotypic).toHaveLength(1);
    expect(exportState.variables.map((e) => e.conceptPath)).toEqual(['\\ds\\age\\']);
  });

  it('changes nothing, not even other parts, when a concept cannot be looked up', async () => {
    loadQuerySummaryData.mockReturnValue(loaded({ errors: ['\\ds\\gone\\'] }));
    fakeSearch.term = 'before';
    await expect(
      applyScreen({
        query: { select: [], phenotypicClause: null, genomicFilters: [] },
        search: 'after',
      }),
    ).rejects.toThrow('\\ds\\gone\\');
    expect(fakeSearch.term).toBe('before');
    expect(exportState.variables).toEqual([]);
  });
});
