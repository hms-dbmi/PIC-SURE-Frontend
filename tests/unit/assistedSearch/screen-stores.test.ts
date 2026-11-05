// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, writable } from 'svelte/store';

const { loadQuerySummaryData } = vi.hoisted(() => ({ loadQuerySummaryData: vi.fn() }));

vi.mock('$lib/components/query/QueryConverters', () => ({ loadQuerySummaryData }));
vi.mock('$lib/stores/Dictionary', () => ({ facetsPromise: writable(Promise.resolve([])) }));
vi.mock('$lib/stores/Search', () => ({
  searchTerm: writable(''),
  selectedFacets: writable([]),
}));

import { applyScreen, readScreen } from '$lib/assistedSearch/screen';
import { exports } from '$lib/stores/Export';
import { filterTree, genomicFilters } from '$lib/stores/Filter';
import { searchTerm, selectedFacets } from '$lib/stores/Search';
import { facetsPromise } from '$lib/stores/Dictionary';
import { LogicTree } from '$lib/models/LogicTree.svelte';
import { createGroup } from '$lib/stores/Filter';
import { createRequiredFilter } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

const result = (conceptPath: string) =>
  ({ conceptPath, dataset: 'ds', name: 'n', display: 'n', type: 'Categorical' }) as SearchResult;

function loaded(over: { errors?: string[] } = {}) {
  const tree = new LogicTree(createGroup);
  tree.add(createRequiredFilter(result('\\ds\\sex\\')));
  return {
    filterTree: Promise.resolve(tree),
    genomicFilters: Promise.resolve([]),
    exports: Promise.resolve([
      { id: 'e1', searchResult: result('\\ds\\age\\'), display: 'age', conceptPath: '\\ds\\age\\' },
    ]),
    errors: Promise.resolve(over.errors ?? []),
  };
}

beforeEach(() => {
  exports.set([]);
  genomicFilters.set([]);
  filterTree.set(new LogicTree(createGroup));
  searchTerm.set('');
  selectedFacets.set([]);
  loadQuerySummaryData.mockReset();
});

describe('readScreen', () => {
  it('describes the filters, selected variables, facets and search as the service expects', () => {
    filterTree.update((tree) => {
      tree.add(createRequiredFilter(result('\\ds\\sex\\')));
      return tree;
    });
    exports.set([
      { id: 'e1', searchResult: result('\\ds\\age\\'), display: 'age', conceptPath: '\\ds\\age\\' },
    ]);
    selectedFacets.set([
      { category: 'study', name: 'NHANES', display: 'NHANES', description: null, count: 3 },
    ]);
    searchTerm.set('bmi');

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
    searchTerm.set('keep');
    await applyScreen({ facets: [{ category: 'study', name: 'NHANES' }] });
    expect(get(searchTerm)).toBe('keep');
    expect(get(selectedFacets)).toMatchObject([{ category: 'study', name: 'NHANES' }]);
    expect(loadQuerySummaryData).not.toHaveBeenCalled();
  });

  it('uses the facets on screen for display and counts', async () => {
    facetsPromise.set(
      Promise.resolve([
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
      ]),
    );
    await applyScreen({ facets: [{ category: 'study', name: 'NHANES' }] });
    expect(get(selectedFacets)).toMatchObject([{ display: 'NHANES study', count: 9 }]);
  });

  it('turns a returned query into the filter tree and selected variables', async () => {
    loadQuerySummaryData.mockReturnValue(loaded());
    await applyScreen({
      query: { select: ['\\ds\\age\\'], phenotypicClause: null, genomicFilters: [] },
    });
    expect(get(filterTree).leafNodes).toHaveLength(1);
    expect(get(exports).map((e) => e.conceptPath)).toEqual(['\\ds\\age\\']);
  });

  it('changes nothing, not even other parts, when a concept cannot be looked up', async () => {
    loadQuerySummaryData.mockReturnValue(loaded({ errors: ['\\ds\\gone\\'] }));
    searchTerm.set('before');
    await expect(
      applyScreen({
        query: { select: [], phenotypicClause: null, genomicFilters: [] },
        search: 'after',
      }),
    ).rejects.toThrow('\\ds\\gone\\');
    expect(get(searchTerm)).toBe('before');
    expect(get(exports)).toEqual([]);
  });
});
