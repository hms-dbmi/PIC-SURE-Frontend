// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

const mockLog = vi.fn();
vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/stores/Dictionary.ts', () => ({
  searchDictionary: vi.fn(),
  updateFacetsFromSearch: vi.fn(),
  facetsPromise: { set: vi.fn() },
  resetFacetState: vi.fn(),
}));
vi.mock('#lib/api.ts', () => ({ isAbortError: () => false }));
vi.mock('#lib/logger.ts', () => ({
  log: (...args: unknown[]) => mockLog(...args),
  createLog: (...args: unknown[]) => args,
  getPageContext: vi.fn(),
}));

import { discardingQuery } from '#lib/discardingQuery.ts';
import { exports } from '#lib/stores/Export.ts';
import { searchTerm, selectedFacets } from '#lib/stores/Search.ts';
import { expandedNestedFacets } from '#lib/stores/NestedFacets.ts';
import type { ExportInterface } from '#lib/models/Export.ts';
import type { Facet } from '#lib/models/Search.ts';

describe('export selections and search after a logout that discards the query', () => {
  beforeEach(() => {
    discardingQuery.set(false);
    exports.set([{ id: 'export', conceptPath: '\\study\\variable\\' } as ExportInterface]);
    searchTerm.set('blood pressure');
    selectedFacets.set([{ name: 'study', category: 'dataset_id' } as Facet]);
    expandedNestedFacets.set(['dataset_id:study']);
    mockLog.mockClear();
  });

  it('keeps them until the logout navigates', () => {
    discardingQuery.set(true);

    expect(get(exports)).toHaveLength(1);
    expect(get(searchTerm)).toBe('blood pressure');
    expect(get(selectedFacets)).toHaveLength(1);
  });

  it('clears them once the logout navigates, without logging a user reset', () => {
    discardingQuery.set(true);
    discardingQuery.set(false);

    expect(get(exports)).toEqual([]);
    expect(get(searchTerm)).toBe('');
    expect(get(selectedFacets)).toEqual([]);
    expect(get(expandedNestedFacets)).toEqual([]);
    expect(mockLog).not.toHaveBeenCalled();
  });
});
