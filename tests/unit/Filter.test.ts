import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$lib/configuration', () => ({ features: { explorer: { enableOrQueries: false } } }));
vi.mock('$lib/stores/User', () => ({
  user: { subscribe: vi.fn() },
  isUserLoggedIn: vi.fn(() => false),
}));

import {
  addFilter,
  updateFilter,
  removeFilter,
  filterTree,
  clearFilters,
  createGroup,
} from '$lib/stores/Filter';
import { createCategoricalFilter, createNumericFilter } from '$lib/models/Filter.svelte';
import type { FilterInterface } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';
import { LogicTree } from '$lib/models/LogicTree.svelte';

function mockSearchResult(conceptPath: string): SearchResult {
  return {
    conceptPath,
    name: conceptPath.split('\\').pop() || conceptPath,
    display: conceptPath.split('\\').pop() || conceptPath,
    type: 'Categorical',
    description: '',
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

  it('updateFilter replaces a filter in place and preserves uuid and position', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    const filter2 = createCategoricalFilter(search, ['value2']);

    addFilter(filter1);
    addFilter(filter2);

    const edited = createCategoricalFilter(search, ['value1', 'extra']);
    updateFilter(filter1.uuid, edited);

    const tree = get(filterTree);
    const leaves = tree.leafNodes;
    expect(leaves.length).toBe(2);
    expect(leaves[0].uuid).toBe(filter1.uuid);
    expect((leaves[0] as typeof filter1).categoryValues).toEqual(['value1', 'extra']);
    expect(leaves[1].uuid).toBe(filter2.uuid);
  });

  it('updateFilter is a no-op when the uuid does not exist', () => {
    const search = mockSearchResult('\\demo\\concept\\path\\');
    const filter1 = createCategoricalFilter(search, ['value1']);
    addFilter(filter1);

    const edited = createCategoricalFilter(search, ['value2']);
    updateFilter('nonexistent-uuid', edited);

    const tree = get(filterTree);
    expect(tree.leafNodes.length).toBe(1);
    expect(tree.leafNodes[0].uuid).toBe(filter1.uuid);
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

describe('filterTree serialization round-trip', () => {
  beforeEach(() => {
    clearFilters();
  });

  it('serializes and deserializes a tree with filters preserving leaf data', () => {
    const search1 = mockSearchResult('\\demo\\concept\\one\\');
    const search2 = mockSearchResult('\\demo\\concept\\two\\');
    const filter1 = createCategoricalFilter(search1, ['val1']);
    const filter2 = createNumericFilter(search2, '10', '99');

    addFilter(filter1);
    addFilter(filter2);

    const original = get(filterTree);
    const serialized = original.serialized;
    const restored = LogicTree.deserialize<FilterInterface>(serialized, createGroup);

    expect(restored.leafNodes.length).toBe(2);

    const leaf1 = restored.leafNodes[0] as typeof filter1;
    expect(leaf1.id).toBe(filter1.id);
    expect(leaf1.categoryValues).toEqual(['val1']);

    const leaf2 = restored.leafNodes[1] as typeof filter2;
    expect(leaf2.id).toBe(filter2.id);
    expect(String(leaf2.min)).toBe('10');
    expect(String(leaf2.max)).toBe('99');
  });

  it('serializes and deserializes a tree with nested groups', () => {
    const search1 = mockSearchResult('\\demo\\a\\');
    const search2 = mockSearchResult('\\demo\\b\\');
    const search3 = mockSearchResult('\\demo\\c\\');

    addFilter(createCategoricalFilter(search1, ['x']));
    addFilter(createCategoricalFilter(search2, ['y']));
    addFilter(createCategoricalFilter(search3, ['z']));

    // Manually inject a subgroup via serialization
    const tree = get(filterTree);
    const serialized = tree.serialized;
    const parsed = JSON.parse(serialized);
    const lastTwo = parsed.children.splice(-2, 2);
    parsed.children.push({ children: lastTwo, operator: 'OR', uuid: 'test-or-group' });
    const withGroup = JSON.stringify(parsed);

    const restored = LogicTree.deserialize<FilterInterface>(withGroup, createGroup);

    expect(restored.leafNodes.length).toBe(3);
    expect(restored.hasOr).toBe(true);
    expect(restored.root.children.length).toBe(2); // 1 leaf + 1 OR group
  });

  it('round-trips through filterTree store set/get', () => {
    const search = mockSearchResult('\\demo\\path\\');
    addFilter(createCategoricalFilter(search, ['a', 'b']));

    const original = get(filterTree);
    const serialized = original.serialized;
    const restored = LogicTree.deserialize<FilterInterface>(serialized, createGroup);

    filterTree.set(restored);

    const final = get(filterTree);
    expect(final.leafNodes.length).toBe(1);
    expect(final.leafNodes[0].id).toBe(original.leafNodes[0].id);
    expect(final.leafNodes[0].uuid).toBe(original.leafNodes[0].uuid);
  });
});
