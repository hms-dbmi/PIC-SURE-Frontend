import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

const console_def = console;

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

const mockState = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    postSpy: vi.fn(),
    logSpy: vi.fn(),
    consentsSettledSpy: vi.fn().mockResolvedValue(undefined),
    showAccessUnavailableSpy: vi.fn(),
    searchTermStore: writable('age'),
    selectedFacetsStore: writable<unknown[]>([]),
    accessUnavailableStore: writable(false),
    consentedStudiesStore: writable<string[]>([]),
  };
});

vi.mock('$lib/api', () => ({
  post: mockState.postSpy,
  isAbortError: (e: unknown) => (e as Error | undefined)?.name === 'AbortError',
}));

vi.mock('$lib/stores/Search', () => ({
  searchTerm: mockState.searchTermStore,
  selectedFacets: mockState.selectedFacetsStore,
}));

vi.mock('$lib/stores/User', () => ({
  ACCESS_UNAVAILABLE_MESSAGE: 'Access unavailable',
  accessUnavailable: mockState.accessUnavailableStore,
  consentedStudies: mockState.consentedStudiesStore,
  consentsSettled: mockState.consentsSettledSpy,
  showAccessUnavailable: mockState.showAccessUnavailableSpy,
}));

vi.mock('$lib/logger', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((category: string, event: string, data?: unknown) => ({
    category,
    event,
    data,
  })),
}));

import type { DictionaryFacetResult } from '$lib/models/api/Dictionary';
import {
  updateFacetsFromSearch,
  searchDictionary,
  getConceptDetails,
  getHierarchyConcepts,
  getConceptTree,
  hiddenFacets,
  openFacets,
  resetFacetState,
} from '$lib/stores/Dictionary';

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
  console.log = () => {};
  console.debug = () => {};
  mockState.postSpy.mockReset();
  mockState.logSpy.mockClear();
  hiddenFacets.set({});
  openFacets.set([]);
  resetFacetState();
});
afterEach(() => {
  console.log = console_def.log;
  console.debug = console_def.debug;
});

describe('updateFacetsFromSearch', () => {
  it('commits hiddenFacets and openFacets for a current response', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));

    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual(['demographics']);
    expect(get(hiddenFacets)).toEqual({ demographics: ['empty'] });
  });

  it('commits when no isCurrent guard is supplied', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));

    await updateFacetsFromSearch();

    expect(get(openFacets)).toEqual(['demographics']);
  });

  it('writes neither store when the response has been superseded', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));

    const response = await updateFacetsFromSearch({ isCurrent: () => false });

    expect(get(openFacets)).toEqual([]);
    expect(get(hiddenFacets)).toEqual({});
    expect(response).toHaveLength(1);
  });

  it('does not let a superseded response overwrite the current one', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('current'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    mockState.postSpy.mockResolvedValueOnce(facetResponse('stale'));
    await updateFacetsFromSearch({ isCurrent: () => false });

    expect(get(openFacets)).toEqual(['current']);
  });

  it('leaves the accordion alone when the same categories come back', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });
    expect(get(openFacets)).toEqual(['demographics']);

    openFacets.set([]);
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual([]);
  });

  it('auto-opens again once the set of categories with results changes', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });
    openFacets.set([]);

    mockState.postSpy.mockResolvedValueOnce(facetResponse('measurements'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual(['measurements']);
  });

  it('resetFacetState lets the next response auto-open again', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });
    openFacets.set([]);

    resetFacetState();
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));
    await updateFacetsFromSearch({ isCurrent: () => true });

    expect(get(openFacets)).toEqual(['demographics']);
  });

  it('forwards the abort signal to api.post', async () => {
    mockState.postSpy.mockResolvedValueOnce(facetResponse('demographics'));
    const controller = new AbortController();

    await updateFacetsFromSearch({ signal: controller.signal, isCurrent: () => true });

    expect(mockState.postSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      undefined,
      undefined,
      { signal: controller.signal },
    );
  });

  it('rethrows an abort without logging it as a failure', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.postSpy.mockRejectedValueOnce(abortError);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(updateFacetsFromSearch({ isCurrent: () => false })).rejects.toThrow('aborted');
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('still logs a genuine failure', async () => {
    mockState.postSpy.mockRejectedValueOnce(new Error('boom'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(updateFacetsFromSearch({ isCurrent: () => true })).rejects.toThrow('boom');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('searchDictionary', () => {
  it('forwards the abort signal to api.post', async () => {
    mockState.postSpy.mockResolvedValueOnce({ content: [], totalElements: 0 });
    const controller = new AbortController();

    await searchDictionary(
      'age',
      [],
      { pageNumber: 0, pageSize: 10 },
      { signal: controller.signal },
    );

    expect(mockState.postSpy).toHaveBeenCalledWith(
      expect.stringContaining('page_number=0'),
      expect.objectContaining({ search: 'age' }),
      undefined,
      undefined,
      { signal: controller.signal },
    );
  });

  it('omits options entirely when no signal is given', async () => {
    mockState.postSpy.mockResolvedValueOnce({ content: [], totalElements: 0 });

    await searchDictionary('age', [], { pageNumber: 0, pageSize: 10 });

    expect(mockState.postSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      undefined,
      undefined,
      undefined,
    );
  });
});

/**
 * The dataset goes into the request path, and `api.send` resolves that path against
 * `window.location.origin` - so `fetch` normalises `..` segments and the request lands
 * wherever the path ends up. `picsure/dictionary/concepts/detail/../../../../psama/studyAccess`
 * resolves to `/psama/studyAccess`, which is the URL, method and string-body shape of
 * `addManualRole()`, carrying whatever the caller passed as a body - and `api.send` attaches
 * the user's bearer token. `\` is a path separator to the URL parser too.
 */
describe('dataset path parameters are escaped', () => {
  const traversal = '../../../../psama/studyAccess';

  beforeEach(() => mockState.postSpy.mockReset());

  function requestedPath(): string {
    return mockState.postSpy.mock.calls.at(-1)?.[0] as string;
  }

  /** What `fetch` would resolve the requested path to, the way `api.send` builds it. */
  function resolved(path: string): string {
    return new URL(path, 'http://localhost/').pathname;
  }

  it('keeps getConceptDetails inside the dictionary namespace', async () => {
    mockState.postSpy.mockResolvedValueOnce({ conceptPath: '\\a\\', dataset: traversal });

    await getConceptDetails('\\a\\', traversal);

    expect(requestedPath()).toBe(
      'picsure/dictionary/concepts/detail/..%2F..%2F..%2F..%2Fpsama%2FstudyAccess',
    );
    expect(resolved(requestedPath())).toBe(
      '/picsure/dictionary/concepts/detail/' + encodeURIComponent(traversal),
    );
  });

  it('keeps getHierarchyConcepts inside the dictionary namespace', async () => {
    mockState.postSpy.mockResolvedValueOnce([]);

    await getHierarchyConcepts(traversal, '\\a\\');

    expect(resolved(requestedPath())).toContain('/picsure/dictionary/concepts/hierarchy/');
  });

  it('keeps getConceptTree inside the dictionary namespace', async () => {
    mockState.postSpy.mockResolvedValueOnce({});

    await getConceptTree(traversal, 1, '\\a\\');

    expect(resolved(requestedPath())).toContain('/picsure/dictionary/concepts/tree/');
  });

  it.each(['...', '%2e', 'a..b', 'test_data_set.v1.p1'])(
    'still allows the dataset %s, which is not a dot segment',
    async (dataset) => {
      mockState.postSpy.mockResolvedValueOnce({ conceptPath: '\\a\\', dataset });

      await getConceptDetails('\\a\\', dataset);

      expect(resolved(requestedPath())).toBe(
        `/picsure/dictionary/concepts/detail/${encodeURIComponent(dataset)}`,
      );
    },
  );

  it('leaves an ordinary dataset name untouched', async () => {
    mockState.postSpy.mockResolvedValueOnce({ conceptPath: '\\a\\', dataset: 'phs000284' });

    await getConceptDetails('\\unescaped\\', 'phs000284');

    expect(requestedPath()).toBe('picsure/dictionary/concepts/detail/phs000284');
  });
});

// Keyed on the concept path alone, the cache answered a request for one dataset's concept
// with another dataset's - so a detail URL naming dataset B rendered dataset A's variable,
// its information and its hierarchy, with no request to reveal the mistake.
describe('getConceptDetails caching', () => {
  const conceptPath = '\\SHARED\\age\\';

  beforeEach(() => mockState.postSpy.mockReset());

  it("does not serve one dataset's concept under another dataset", async () => {
    mockState.postSpy.mockResolvedValueOnce({ conceptPath, dataset: 'phs111', display: 'A' });
    mockState.postSpy.mockResolvedValueOnce({ conceptPath, dataset: 'phs222', display: 'B' });

    const first = await getConceptDetails(conceptPath, 'phs111');
    const second = await getConceptDetails(conceptPath, 'phs222');

    expect(first.display).toBe('A');
    expect(second.display).toBe('B');
    expect(mockState.postSpy).toHaveBeenCalledTimes(2);
  });

  it('still serves a repeat of the same dataset and path from the cache', async () => {
    mockState.postSpy.mockResolvedValueOnce({ conceptPath, dataset: 'phs333', display: 'C' });

    await getConceptDetails(conceptPath, 'phs333');
    const again = await getConceptDetails(conceptPath, 'phs333');

    expect(again.display).toBe('C');
    expect(mockState.postSpy).toHaveBeenCalledTimes(1);
  });
});
