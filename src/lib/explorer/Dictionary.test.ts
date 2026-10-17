import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

const mockState = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    requestSpy: vi.fn(),
    logSpy: vi.fn(),
    consentsSettledSpy: vi.fn().mockResolvedValue(undefined),
    showAccessUnavailableSpy: vi.fn(),
    searchTermStore: writable('age'),
    selectedFacetsStore: writable<unknown[]>([]),
    accessUnavailableStore: writable(false),
    consentedStudiesStore: writable<string[]>([]),
  };
});

vi.mock('#lib/api/client.ts', () => ({ request: mockState.requestSpy }));

vi.mock('#lib/explorer/Search.ts', () => ({
  searchTerm: mockState.searchTermStore,
  selectedFacets: mockState.selectedFacetsStore,
}));

vi.mock('#lib/auth/User.ts', () => ({
  ACCESS_UNAVAILABLE_MESSAGE: 'Access unavailable',
  accessUnavailable: mockState.accessUnavailableStore,
  consentedStudies: mockState.consentedStudiesStore,
  consentsSettled: mockState.consentsSettledSpy,
  showAccessUnavailable: mockState.showAccessUnavailableSpy,
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((category: string, event: string, data?: unknown) => ({
    category,
    event,
    data,
  })),
}));

import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
import {
  updateFacetsFromSearch,
  searchDictionary,
  hiddenFacets,
  openFacets,
  resetFacetState,
} from '#lib/explorer/Dictionary.ts';

function facetResponse(categoryName: string, zeroCountFacet = 'empty'): DictionaryFacetResult[] {
  return [
    {
      name: categoryName,
      display: categoryName,
      description: '',
      facets: [
        { name: 'live', display: 'live', description: '', count: 5, category: categoryName },
        {
          name: zeroCountFacet,
          display: zeroCountFacet,
          description: '',
          count: 0,
          category: categoryName,
        },
      ],
    },
  ] as unknown as DictionaryFacetResult[];
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  mockState.requestSpy.mockReset();
  mockState.logSpy.mockClear();
  hiddenFacets.set({});
  openFacets.set([]);
  resetFacetState();
});
afterEach(() => {
  vi.mocked(console.log).mockRestore();
  vi.mocked(console.debug).mockRestore();
});

describe('updateFacetsFromSearch', () => {
  it('commits hiddenFacets and openFacets for a current response', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));

    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual(['demographics']);
    expect(get(hiddenFacets)).toEqual({ demographics: ['empty'] });
  });

  it('commits when no isCurrent guard is supplied', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));

    await updateFacetsFromSearch();

    expect(get(openFacets)).toEqual(['demographics']);
  });

  it('writes neither store when the response has been superseded', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));

    const response = await updateFacetsFromSearch({ isCurrent: () => false });

    expect(get(openFacets)).toEqual([]);
    expect(get(hiddenFacets)).toEqual({});
    expect(response).toHaveLength(1);
  });

  it('does not let a superseded response overwrite the current one', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('current'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    mockState.requestSpy.mockResolvedValueOnce(facetResponse('stale'));
    await updateFacetsFromSearch({ isCurrent: () => false });

    expect(get(openFacets)).toEqual(['current']);
  });

  it('leaves the accordion alone when the same categories come back', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });
    expect(get(openFacets)).toEqual(['demographics']);

    openFacets.set([]);
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual([]);
  });

  it('auto-opens again once the set of categories with results changes', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });
    openFacets.set([]);

    mockState.requestSpy.mockResolvedValueOnce(facetResponse('measurements'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual(['measurements']);
  });

  it('resetFacetState lets the next response auto-open again', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });
    openFacets.set([]);

    resetFacetState();
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual(['demographics']);
  });

  it('forwards the abort signal to the facets request', async () => {
    mockState.requestSpy.mockResolvedValueOnce(facetResponse('demographics'));
    const controller = new AbortController();

    await updateFacetsFromSearch({ signal: controller.signal, isCurrent: () => true });

    expect(mockState.requestSpy).toHaveBeenCalledWith(
      'picsure/dictionary/facets',
      expect.objectContaining({ method: 'POST', auth: 'open', signal: controller.signal }),
    );
  });

  it('rethrows an abort without logging it as a failure', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.requestSpy.mockRejectedValueOnce(abortError);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(updateFacetsFromSearch({ isCurrent: () => false })).rejects.toThrow('aborted');
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('still logs a genuine failure', async () => {
    mockState.requestSpy.mockRejectedValueOnce(new Error('boom'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(updateFacetsFromSearch({ isCurrent: () => true })).rejects.toThrow('boom');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('searchDictionary', () => {
  it('forwards the page and the abort signal to the concepts request', async () => {
    mockState.requestSpy.mockResolvedValueOnce({ content: [], totalElements: 0 });
    const controller = new AbortController();

    await searchDictionary(
      'age',
      [],
      { pageNumber: 0, pageSize: 10 },
      { signal: controller.signal },
    );

    expect(mockState.requestSpy).toHaveBeenCalledWith('picsure/dictionary/concepts', {
      method: 'POST',
      query: { page_number: 0, page_size: 10 },
      body: expect.objectContaining({ search: 'age' }),
      auth: 'open',
      signal: controller.signal,
    });
  });

  it('sends no signal when none is given', async () => {
    mockState.requestSpy.mockResolvedValueOnce({ content: [], totalElements: 0 });

    await searchDictionary('age', [], { pageNumber: 0, pageSize: 10 });

    expect(mockState.requestSpy).toHaveBeenCalledWith(
      'picsure/dictionary/concepts',
      expect.objectContaining({ signal: undefined }),
    );
  });
});
