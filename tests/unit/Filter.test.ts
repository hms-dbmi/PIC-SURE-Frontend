import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$lib/configuration', () => ({ features: { explorer: { enableOrQueries: false } } }));
vi.mock('$lib/stores/User', () => ({ user: { subscribe: vi.fn() } }));

import {
  addFilter,
  removeFilter,
  filterTree,
  clearFilters,
} from '$lib/stores/Filter';
import {
  createCategoricalFilter,
  createNumericFilter,
} from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

function mockSearchResult(conceptPath: string): SearchResult {
  return {
    conceptPath,
    name: conceptPath.split('\\').pop() || conceptPath,
    display: conceptPath.split('\\').pop() || conceptPath,
    type: 'Categorical',
    allowFiltering: true,
    dataset: 'test-dataset',
    studyAcronym: 'TEST',
    children: [],
  } as SearchResult;
}

describe('addFilter - duplicate filters', () => {
  beforeEach(() => {
    clearFilters();
  });

  it('allows adding duplicate phenotypic filters with the same id', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value2']);

    addFilter(filter1);
    addFilter(filter2);

    const tree = get(filterTree);
    const leaves = tree.leafNodes;
    expect(leaves.length).toBe(2);
  });

  it('allows adding the same filter with identical values', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value1']);

    addFilter(filter1);
    addFilter(filter2);

    const tree = get(filterTree);
    const leaves = tree.leafNodes;
    expect(leaves.length).toBe(2);
  });

  it('each duplicate filter gets a unique uuid', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value1']);

    expect(filter1.uuid).not.toBe(filter2.uuid);
  });

  it('removing one duplicate does not remove the other', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value2']);

    addFilter(filter1);
    addFilter(filter2);

    removeFilter(filter1.uuid);

    const tree = get(filterTree);
    const leaves = tree.leafNodes;
    expect(leaves.length).toBe(1);
    expect(leaves[0].uuid).toBe(filter2.uuid);
  });

  it('allows multiple numeric filters on the same concept path', () => {
    const search = mockSearchResult('\\demo\\numeric\\path\\');
    const filter1 = createNumericFilter(search, '0', '50');
    const filter2 = createNumericFilter(search, '51', '100');

    addFilter(filter1);
    addFilter(filter2);

    const tree = get(filterTree);
    const leaves = tree.leafNodes;
    expect(leaves.length).toBe(2);
  });
});
