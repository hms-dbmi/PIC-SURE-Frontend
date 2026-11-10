// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

const mockLog = vi.fn();
vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/stores/User.ts', () => ({
  user: { subscribe: (run: (user: object) => void) => (run({}), () => {}) },
  ensureConsentsLoaded: vi.fn(),
}));
vi.mock('#lib/stores/Dictionary.ts', () => ({ getConceptDetails: vi.fn() }));
vi.mock('#lib/logger.ts', () => ({
  log: (...args: unknown[]) => mockLog(...args),
  createLog: (...args: unknown[]) => args,
  registerAssociatedStudies: vi.fn(),
  getPageContext: vi.fn(),
}));

import { discardingQuery } from '#lib/discardingQuery.ts';
import { addFilter, clearFilters, filterTree, genomicFilters } from '#lib/stores/Filter.ts';
import { createCategoricalFilter, createGenomicFilter } from '#lib/models/Filter.svelte.ts';
import type { SearchResult } from '#lib/models/Search.ts';

const searchResult = {
  conceptPath: '\\study\\variable\\',
  name: 'variable',
  display: 'variable',
  type: 'Categorical',
  description: '',
  allowFiltering: true,
  dataset: 'study',
  studyAcronym: 'STUDY',
  children: [],
} as SearchResult;

function storedFilterCount() {
  const tree = sessionStorage.getItem('filterTree');
  return tree === null ? null : JSON.parse(tree).children.length;
}

describe('filters after a forbidden logout', () => {
  beforeEach(() => {
    discardingQuery.set(false);
    clearFilters();
    sessionStorage.clear();
    addFilter(createCategoricalFilter(searchResult, ['Yes']));
    addFilter(createGenomicFilter({ Gene_with_variant: ['BRCA1'] }));
    mockLog.mockClear();
  });

  it('removes the stored filters at once and keeps the stores until the logout navigates', () => {
    discardingQuery.set(true);

    expect(sessionStorage.getItem('filterTree')).toBeNull();
    expect(sessionStorage.getItem('genomicFilters')).toBeNull();
    expect(get(filterTree).root.children).toHaveLength(1);
    expect(get(genomicFilters)).toHaveLength(1);
  });

  it('does not store filter changes made before the logout navigates', () => {
    discardingQuery.set(true);

    addFilter(
      createCategoricalFilter({ ...searchResult, conceptPath: '\\study\\other\\' }, ['No']),
    );

    expect(sessionStorage.getItem('filterTree')).toBeNull();
  });

  it('resets the stores once the logout navigates, without logging a user clear', () => {
    discardingQuery.set(true);

    discardingQuery.set(false);

    expect(get(filterTree).root.children).toHaveLength(0);
    expect(get(genomicFilters)).toHaveLength(0);
    expect(storedFilterCount()).toBe(0);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('leaves the filters alone after a logout that was not forbidden', () => {
    discardingQuery.set(false);

    expect(get(filterTree).root.children).toHaveLength(1);
    expect(storedFilterCount()).toBe(1);
  });
});
