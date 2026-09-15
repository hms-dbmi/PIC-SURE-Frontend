import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$lib/stores/User', () => ({
  user: { subscribe: (run: (user: object) => void) => (run({}), () => {}) },
  ensureConsentsLoaded: vi.fn(),
  isUserLoggedIn: vi.fn(() => false),
}));
vi.mock('$lib/stores/Dictionary', () => ({ getConceptDetails: vi.fn() }));

import { addFilter, clearFilters, filterTree, genomicFilters } from '$lib/stores/Filter';
import { addExport, clearExports } from '$lib/stores/Export';
import { cohortContents } from '$lib/stores/ResultsSummaryPanel';
import { Operator } from '$lib/models/query/Query';
import { createCategoricalFilter, createGenomicFilter } from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

function mockSearchResult(conceptPath: string): SearchResult {
  return {
    conceptPath,
    name: conceptPath,
    display: conceptPath,
    type: 'Categorical',
    description: '',
    dataset: 'test-dataset',
    allowFiltering: true,
    values: ['a', 'b'],
  } as unknown as SearchResult;
}

function addCategoricalFilter(conceptPath: string) {
  addFilter(createCategoricalFilter(mockSearchResult(conceptPath), ['a']));
}

const revision = () => get(cohortContents).revision;

function mockExport(conceptPath: string) {
  return {
    id: conceptPath,
    display: conceptPath,
    conceptPath,
    searchResult: mockSearchResult(conceptPath),
  };
}

describe('cohortContents', () => {
  beforeEach(() => {
    clearFilters();
    clearExports();
  });

  it('is empty when nothing is filtered and nothing is added for analysis', () => {
    expect(get(cohortContents).isEmpty).toBe(true);
  });

  it('reports a filter, and a new revision for it', () => {
    const before = revision();

    addCategoricalFilter('\\test\\one\\');

    expect(get(cohortContents).isEmpty).toBe(false);
    expect(revision()).not.toBe(before);
  });

  it('reports a genomic filter, which lives in its own store', () => {
    const before = revision();

    addFilter(createGenomicFilter({ Gene_with_variant: ['CHD8'] }));

    expect(get(cohortContents).isEmpty).toBe(false);
    expect(revision()).not.toBe(before);
    expect(get(genomicFilters)).toHaveLength(1);
  });

  it('reports an export', () => {
    const before = revision();

    addExport(mockExport('\\test\\height\\'));

    expect(get(cohortContents).isEmpty).toBe(false);
    expect(revision()).not.toBe(before);
  });

  it('changes revision for a regrouped query that keeps the same filters', () => {
    addCategoricalFilter('\\test\\one\\');
    addCategoricalFilter('\\test\\two\\');
    const before = revision();

    // What the Advanced Query Builder's Apply does: set a clone of the edited tree. The clone
    // carries the original root uuid, so only the operator distinguishes it.
    const edited = get(filterTree).clone();
    edited.root.operator = Operator.OR;
    filterTree.set(edited);

    expect(get(filterTree).leafNodes).toHaveLength(2);
    expect(revision()).not.toBe(before);
  });

  it('does not change revision when re-read without a change', () => {
    addCategoricalFilter('\\test\\one\\');

    expect(revision()).toBe(revision());
  });

  it('is empty again once the cohort is cleared', () => {
    addCategoricalFilter('\\test\\one\\');
    addExport(mockExport('\\test\\height\\'));

    clearFilters();
    clearExports();

    expect(get(cohortContents).isEmpty).toBe(true);
  });
});
