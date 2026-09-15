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
import type { Filter, FilterInterface } from '$lib/models/Filter.svelte';
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

const items = () => get(cohortContents).items;
const structure = () => get(cohortContents).structure;
/**
 * The identities the cohort now holds beyond what `before` held, counting duplicates the way
 * the consumer does. A set difference would be wrong here for the same reason it was wrong in
 * `autoOpenForCohort`: gaining a second copy of an identity already present is a gain.
 */
const gainedSince = (before: string[]) => {
  const unclaimed = new Map<string, number>();
  for (const item of before) unclaimed.set(item, (unclaimed.get(item) ?? 0) + 1);
  return items().filter((item) => {
    const left = unclaimed.get(item) ?? 0;
    if (left === 0) return true;
    unclaimed.set(item, left - 1);
    return false;
  });
};

describe('cohortContents', () => {
  beforeEach(() => {
    // A brand new tree, not clearFilters(): that empties the root's children but leaves its
    // operator wherever the last test left it.
    setFilterTree(new LogicTree(createGroup));
    genomicFilters.set([]);
    clearExports();
    vi.mocked(getConceptDetails).mockReset();
  });

  it('gives one identity to each filter, genomic filter and added variable', () => {
    expect(items()).toEqual([]);

    addCategoricalFilter('\\test\\one\\');
    addFilter(createGenomicFilter({ Gene_with_variant: ['CHD8'] }));
    addExport(mockExport('\\test\\height\\'));

    expect(items()).toHaveLength(3);
    expect(get(genomicFilters)).toHaveLength(1);
    // Tagged by which store they came from, so the three can never collide with each other.
    expect(items().map((item) => item.split(':')[0])).toEqual(['filter', 'genomic', 'variable']);
  });

  it('gains an identity when a filter is added', () => {
    const before = items();

    addCategoricalFilter('\\test\\one\\');

    expect(gainedSince(before)).toHaveLength(1);
  });

  it('gains an identity when a smaller set of different filters replaces a larger one', () => {
    // A dataset restore over filters the user already had. The cohort ends up smaller, so a
    // count would read it as a removal, but every filter in it is new.
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    addCategoricalFilter('\\test\\three\\');
    const before = items();

    const replacement = new LogicTree<FilterInterface>(createGroup);
    replacement.add(createCategoricalFilter(mockSearchResult('\\test\\four\\'), ['a']));
    setFilterTree(replacement);

    expect(items()).toHaveLength(1);
    expect(gainedSince(before)).toHaveLength(1);
  });

  it('keeps the same identities but a new structure for a regrouped query', () => {
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = items();
    const beforeStructure = structure();

    // What the Advanced Query Builder's Apply does: set a clone of the edited tree. The clone
    // round-trips the root uuid, so only the operator distinguishes it.
    const edited = get(filterTree).clone();
    edited.root.operator = Operator.OR;
    filterTree.set(edited);

    expect(items()).toEqual(before);
    expect(structure()).not.toBe(beforeStructure);
  });

  it('changes nothing for a mutator that changed nothing', () => {
    // removeUnallowedFilters regenerates the root uuid and writes the store whether or not it
    // removed anything, and every filter here is allowed. Nothing changed, so the panel must
    // not be able to tell that anything happened.
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = items();
    const beforeStructure = structure();

    removeUnallowedFilters();

    expect(items()).toEqual(before);
    expect(structure()).toBe(beforeStructure);
  });

  it('changes nothing after a filter is enriched in place', async () => {
    // enrichFilterDetails patches searchResult.table and searchResult.study onto a filter
    // already in the tree, in place, and never calls filterTree.set - so a mounted panel
    // never sees it and the next read of the store would otherwise disagree with the last.
    // A Continuous filter is the production trigger: AddFilter only re-fetches details for
    // Categorical, so its searchResult arrives with no `table` and the enrich guard passes.
    const searchResult = mockSearchResult('\\test\\age\\', 'Continuous');
    const filter = createNumericFilter(searchResult, '1', '99') as Filter;
    addFilter(filter);
    const before = items();
    const beforeStructure = structure();

    vi.mocked(getConceptDetails).mockResolvedValue({
      ...searchResult,
      table: { name: 'a-table' },
      study: { ref: 'a-study' },
    } as unknown as SearchResult);
    enrichFilterDetails(filter, searchResult.conceptPath, searchResult.dataset || '');
    await vi.waitFor(() => expect(getConceptDetails).toHaveBeenCalled());
    await Promise.resolve();

    expect(filter.searchResult?.table).toBeDefined();
    expect(items()).toEqual(before);
    expect(structure()).toBe(beforeStructure);
  });

  it('gives two filters holding the same content the same identity, twice over', () => {
    // The premise the consumer's counting rests on. Nothing dedupes phenotypic filters -
    // not addFilter, not LogicTree.add, not queryToFilterTree, which maps a saved query's
    // clauses straight across - so a restored dataset can legitimately hold two of these.
    addCategoricalFilter('\\test\\one\\');
    const afterFirst = items();
    addCategoricalFilter('\\test\\one\\');

    expect(items()).toHaveLength(2);
    expect(items()[0]).toBe(items()[1]);
    // And the second copy reads as a gain, which is what the consumer counts on - and what
    // `gainedSince` would miss if it compared as a set.
    expect(gainedSince(afterFirst)).toHaveLength(1);
  });

  it('gives the same identities after a sessionStorage round trip', () => {
    // What a page load does to a cohort: the tree goes out to sessionStorage as a string and
    // comes back through LogicTree.deserialize, which rebuilds each leaf from the JSON rather
    // than from the factory that made it.
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = items();
    const beforeStructure = structure();

    setFilterTree(LogicTree.deserialize<FilterInterface>(get(filterTree).serialized, createGroup));

    expect(items()).toEqual(before);
    expect(structure()).toBe(beforeStructure);
  });

  it('gives the same identity to an item whose fields were assigned in another order', () => {
    // The property the key sorting exists for, under actual stress: a restore rebuilds an
    // added variable from a saved query rather than from a search row, so the same variable
    // can arrive with its properties in a different order. The round trip above cannot show
    // this, because it reproduces the order it serialized.
    const variable = mockExport('\\test\\height\\');
    addExport(variable);
    const before = items();

    clearExports();
    addExport({
      searchResult: variable.searchResult,
      conceptPath: variable.conceptPath,
      display: variable.display,
      id: variable.id,
    });

    expect(items()).toEqual(before);
  });

  it('distinguishes added variables that share a concept path', () => {
    // A dataset restore sets `exports` wholesale and can supply metadata the search page
    // never would, so an identity cannot be the concept path alone.
    addExport(mockExport('\\test\\height\\'));
    const before = items();

    clearExports();
    addExport({ ...mockExport('\\test\\height\\'), display: 'Height (cm)' });

    expect(gainedSince(before)).toHaveLength(1);
  });

  it('holds no identities once the cohort is emptied', () => {
    addCategoricalFilter('\\test\\one\\');
    addExport(mockExport('\\test\\height\\'));
    expect(items()).toHaveLength(2);

    setFilterTree(new LogicTree(createGroup));
    clearExports();

    expect(items()).toEqual([]);
  });

  it('gains nothing when a filter is removed', () => {
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = items();
    const removed = get(filterTree).leafNodes[0] as Filter;

    removeFilter(removed.uuid);

    expect(items()).toHaveLength(1);
    expect(gainedSince(before)).toEqual([]);
  });
});
