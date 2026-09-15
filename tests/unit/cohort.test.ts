import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$lib/stores/User', () => ({
  user: { subscribe: (run: (user: object) => void) => (run({}), () => {}) },
  ensureConsentsLoaded: vi.fn(),
  isUserLoggedIn: vi.fn(() => false),
}));
vi.mock('$lib/stores/Dictionary', () => ({ getConceptDetails: vi.fn() }));

import {
  addFilter,
  createGroup,
  enrichFilterDetails,
  filterTree,
  genomicFilters,
  removeFilter,
  removeUnallowedFilters,
  setFilterTree,
} from '$lib/stores/Filter';
import { addExport, clearExports } from '$lib/stores/Export';
import { getConceptDetails } from '$lib/stores/Dictionary';
import { cohortContents } from '$lib/stores/Cohort';
import { Operator } from '$lib/models/query/Query';
import {
  createCategoricalFilter,
  createGenomicFilter,
  createNumericFilter,
} from '$lib/models/Filter.svelte';
import type { Filter } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';
import { LogicTree } from '$lib/models/LogicTree.svelte';

/** A dictionary row as the search endpoint returns it: no `table`, no `study`. */
function mockSearchResult(conceptPath: string, type = 'Categorical'): SearchResult {
  return {
    conceptPath,
    name: conceptPath,
    display: conceptPath,
    type,
    description: '',
    dataset: 'test-dataset',
    allowFiltering: true,
    values: ['a', 'b'],
  } as unknown as SearchResult;
}

function mockExport(conceptPath: string) {
  return {
    id: conceptPath,
    display: conceptPath,
    conceptPath,
    searchResult: mockSearchResult(conceptPath),
  };
}

function addCategoricalFilter(conceptPath: string) {
  addFilter(createCategoricalFilter(mockSearchResult(conceptPath), ['a']));
}

const size = () => get(cohortContents).size;
const signature = () => get(cohortContents).signature;

describe('cohortContents', () => {
  beforeEach(() => {
    // A brand new tree, not clearFilters(): that empties the root's children but leaves its
    // operator wherever the last test left it.
    setFilterTree(new LogicTree(createGroup));
    genomicFilters.set([]);
    clearExports();
    vi.mocked(getConceptDetails).mockReset();
  });

  it('counts filters, genomic filters and added variables together', () => {
    expect(size()).toBe(0);

    addCategoricalFilter('\\test\\one\\');
    addFilter(createGenomicFilter({ Gene_with_variant: ['CHD8'] }));
    addExport(mockExport('\\test\\height\\'));

    expect(size()).toBe(3);
    expect(get(genomicFilters)).toHaveLength(1);
  });

  it('gives a different signature to a different query', () => {
    const empty = signature();

    addCategoricalFilter('\\test\\one\\');

    expect(signature()).not.toBe(empty);
  });

  it('gives a different signature to a regrouped query of the same filters', () => {
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = signature();

    // What the Advanced Query Builder's Apply does: set a clone of the edited tree. The clone
    // round-trips the root uuid, so only the operator distinguishes it.
    const edited = get(filterTree).clone();
    edited.root.operator = Operator.OR;
    filterTree.set(edited);

    expect(size()).toBe(2);
    expect(signature()).not.toBe(before);
  });

  it('gives the same signature to a mutator that changed nothing', () => {
    // removeUnallowedFilters regenerates the root uuid and writes the store whether or not it
    // removed anything, and every filter here is allowed. Nothing changed, so the panel must
    // not be able to tell that anything happened.
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = signature();

    removeUnallowedFilters();

    expect(size()).toBe(2);
    expect(signature()).toBe(before);
  });

  it('gives the same signature after a filter is enriched in place', async () => {
    // enrichFilterDetails patches searchResult.table and searchResult.study onto a filter
    // already in the tree, in place, and never calls filterTree.set - so a mounted panel
    // never sees it and the next read of the store would otherwise disagree with the last.
    // A Continuous filter is the production trigger: AddFilter only re-fetches details for
    // Categorical, so its searchResult arrives with no `table` and the enrich guard passes.
    const searchResult = mockSearchResult('\\test\\age\\', 'Continuous');
    const filter = createNumericFilter(searchResult, '1', '99') as Filter;
    addFilter(filter);
    const before = signature();

    vi.mocked(getConceptDetails).mockResolvedValue({
      ...searchResult,
      table: { name: 'a-table' },
      study: { ref: 'a-study' },
    } as unknown as SearchResult);
    enrichFilterDetails(filter, searchResult.conceptPath, searchResult.dataset || '');
    await vi.waitFor(() => expect(getConceptDetails).toHaveBeenCalled());
    await Promise.resolve();

    expect(filter.searchResult?.table).toBeDefined();
    expect(signature()).toBe(before);
  });

  it('gives the same signature to the same export read twice', () => {
    addExport(mockExport('\\test\\height\\'));

    expect(signature()).toBe(signature());
  });

  it('distinguishes added variables that share a concept path', () => {
    // A dataset restore sets `exports` wholesale and can supply metadata the search page
    // never would, so the signature cannot be the concept paths alone.
    addExport(mockExport('\\test\\height\\'));
    const before = signature();

    clearExports();
    addExport({ ...mockExport('\\test\\height\\'), display: 'Height (cm)' });

    expect(signature()).not.toBe(before);
  });

  it('shrinks back to nothing when the cohort is emptied', () => {
    addCategoricalFilter('\\test\\one\\');
    addExport(mockExport('\\test\\height\\'));
    expect(size()).toBe(2);

    setFilterTree(new LogicTree(createGroup));
    clearExports();

    expect(size()).toBe(0);
  });

  it('shrinks when a filter is removed', () => {
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const removed = get(filterTree).leafNodes[0] as Filter;

    removeFilter(removed.uuid);

    expect(size()).toBe(1);
  });
});
