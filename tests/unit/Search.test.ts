import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

type FacetCallOptions = { signal: AbortSignal; isCurrent: () => boolean };

const mockState = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    searchDictionarySpy: vi.fn(),
    updateFacetsSpy: vi.fn((options?: unknown) => {
      void options;
      return Promise.resolve([]);
    }),
    facetsPromiseStore: writable<Promise<unknown>>(Promise.resolve([])),
    resetFacetStateSpy: vi.fn(),
    logSpy: vi.fn(),
  };
});

vi.mock('$lib/stores/Dictionary', () => ({
  searchDictionary: mockState.searchDictionarySpy,
  updateFacetsFromSearch: mockState.updateFacetsSpy,
  facetsPromise: mockState.facetsPromiseStore,
  resetFacetState: mockState.resetFacetStateSpy,
}));

vi.mock('$lib/components/datatable/stores', () => ({
  getDefaultRows: () => 10,
}));

vi.mock('$lib/logger', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((category: string, event: string, data?: unknown) => ({
    category,
    event,
    data,
  })),
  getPageContext: () => 'explorer',
}));

vi.mock('$lib/api', () => ({
  isAbortError: (e: unknown) => (e as Error | undefined)?.name === 'AbortError',
}));

import type { State } from '@vincjo/datatables/server';
import type { Facet, SearchResult } from '$lib/models/Search';
import {
  initHandler,
  tableHandler,
  searchTerm,
  selectedFacets,
  error,
  loading,
  nextSearchSettled,
  updateFacets,
} from '$lib/stores/Search';

type LoadCallback = (state: State) => Promise<SearchResult[] | undefined>;

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.catch(() => {});
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await new Promise<void>((r) => r());
  await new Promise<void>((r) => r());
}

function makeState(overrides: Partial<{ currentPage: number; rowsPerPage: number }> = {}) {
  const setTotalRows = vi.fn();
  const state = {
    currentPage: 1,
    rowsPerPage: 10,
    offset: 0,
    search: '',
    sort: undefined,
    filters: undefined,
    setTotalRows,
    ...overrides,
  } as unknown as State;
  return { state, setTotalRows };
}

function facet(name: string, category = 'cat', count = 1): Facet {
  return { name, display: name, description: '', count, category } as Facet;
}

function rows(id: string): SearchResult[] {
  return [{ conceptPath: id } as SearchResult];
}

function conceptResponse(id: string, totalElements = 1) {
  return { content: rows(id), totalElements };
}

/** The signal handed to searchDictionary for the Nth concept request. */
function conceptSignal(call: number): AbortSignal {
  return mockState.searchDictionarySpy.mock.calls[call][3].signal;
}

/** The options handed to updateFacetsFromSearch for the Nth facet request. */
function facetOptions(call: number): FacetCallOptions {
  return mockState.updateFacetsSpy.mock.calls[call][0] as FacetCallOptions;
}

let load: LoadCallback;
let release: () => void;

beforeEach(() => {
  mockState.searchDictionarySpy.mockReset();
  mockState.updateFacetsSpy.mockReset().mockImplementation(() => Promise.resolve([]));
  mockState.logSpy.mockClear();

  searchTerm.set('');
  selectedFacets.set([]);
  error.set('');
  loading.set(false);

  // Drives loads directly, bypassing the debounce and the library's scheduling.
  const loadSpy = vi.spyOn(tableHandler, 'load').mockImplementation((cb) => {
    load = cb as LoadCallback;
  });
  release = initHandler();
  loadSpy.mockRestore();
});

describe('concept request race', () => {
  it('drops a superseded response even when it resolves last', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const { state: stateA } = makeState();
    const promiseA = load(stateA);
    searchTerm.set('bmi');
    const { state: stateB } = makeState();
    const promiseB = load(stateB);

    dB.resolve(conceptResponse('b'));
    await expect(promiseB).resolves.toEqual(rows('b'));

    dA.resolve(conceptResponse('a'));
    await expect(promiseA).resolves.toBeUndefined();
  });

  it('drops a superseded response when it resolves first', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    searchTerm.set('bmi');
    const promiseB = load(makeState().state);

    dA.resolve(conceptResponse('a'));
    await expect(promiseA).resolves.toBeUndefined();

    dB.resolve(conceptResponse('b'));
    await expect(promiseB).resolves.toEqual(rows('b'));
  });

  it('aborts the previous concept request when a new load starts', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockReturnValue(deferred<unknown>().promise);

    void load(makeState().state);
    expect(conceptSignal(0).aborted).toBe(false);

    searchTerm.set('bmi');
    void load(makeState().state);

    expect(conceptSignal(0).aborted).toBe(true);
    expect(conceptSignal(1).aborted).toBe(false);
  });

  it('does not let a superseded response write totalRows', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const { state: stateA, setTotalRows: setTotalRowsA } = makeState();
    const promiseA = load(stateA);
    searchTerm.set('bmi');
    const { state: stateB, setTotalRows: setTotalRowsB } = makeState();
    const promiseB = load(stateB);

    dB.resolve(conceptResponse('b', 42));
    await promiseB;
    dA.resolve(conceptResponse('a', 9999));
    await promiseA;

    expect(setTotalRowsB).toHaveBeenCalledWith(42);
    expect(setTotalRowsA).not.toHaveBeenCalled();
  });

  it('keeps the spinner up when a superseded request settles first', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    searchTerm.set('bmi');
    const promiseB = load(makeState().state);
    expect(get(loading)).toBe(true);

    dA.resolve(conceptResponse('a'));
    await promiseA;
    expect(get(loading)).toBe(true);

    dB.resolve(conceptResponse('b'));
    await promiseB;
    expect(get(loading)).toBe(false);
  });

  it('logs the term the request was built with', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a', 7));

    await load(makeState().state);

    expect(mockState.logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'search.results',
        data: expect.objectContaining({ term: 'age', totalResults: 7 }),
      }),
    );
  });

  it('emits no results event for a superseded request', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    searchTerm.set('bmi');
    const promiseB = load(makeState().state);

    dB.resolve(conceptResponse('b', 3));
    await promiseB;
    dA.resolve(conceptResponse('a', 9999));
    await promiseA;

    const resultEvents = mockState.logSpy.mock.calls
      .map(([entry]) => entry as { event: string; data?: { totalResults?: number } })
      .filter((entry) => entry.event === 'search.results');
    expect(resultEvents).toHaveLength(1);
    expect(resultEvents[0].data?.totalResults).toBe(3);
  });
});

describe('error handling', () => {
  it('returns undefined rather than [] on failure so existing rows survive', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));

    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(get(error)).not.toBe('');
  });

  it('does not surface an error from a superseded failure', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    searchTerm.set('bmi');
    const promiseB = load(makeState().state);

    dB.resolve(conceptResponse('b'));
    await promiseB;
    dA.reject(new Error('late failure'));
    await promiseA;

    expect(get(error)).toBe('');
  });

  it('does not surface an error when a request is aborted', async () => {
    searchTerm.set('age');
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.searchDictionarySpy.mockRejectedValueOnce(abortError);

    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(get(error)).toBe('');
  });

  it('clears a stale error at the start of the next load - including a facet click', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));
    await load(makeState().state);
    expect(get(error)).not.toBe('');

    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a'));
    selectedFacets.set([facet('f1')]);
    await load(makeState().state);
    expect(get(error)).toBe('');
  });

  it('still returns [] for empty criteria so a reset clears the table', async () => {
    const { state, setTotalRows } = makeState();
    await expect(load(state)).resolves.toEqual([]);
    expect(setTotalRows).toHaveBeenCalledWith(0);
    expect(mockState.searchDictionarySpy).not.toHaveBeenCalled();
  });
});

describe('facet generation is independent of the concept generation', () => {
  it('a pagination-only load neither refetches nor aborts facets', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ currentPage: 1 }).state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
    const first = facetOptions(0);

    await load(makeState({ currentPage: 2 }).state);

    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
    expect(first.signal.aborted).toBe(false);
    expect(first.isCurrent()).toBe(true);
  });

  it('a rows-per-page change does not refetch facets', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ rowsPerPage: 10 }).state);
    await load(makeState({ rowsPerPage: 25 }).state);

    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('a criteria change supersedes and aborts the previous facet request', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState().state);
    const first = facetOptions(0);

    searchTerm.set('bmi');
    await load(makeState().state);

    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(2);
    expect(first.signal.aborted).toBe(true);
    expect(first.isCurrent()).toBe(false);
    expect(facetOptions(1).isCurrent()).toBe(true);
  });

  it('publishes the new facets promise before aborting the old request', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    await load(makeState().state);

    const firstPromise = get(mockState.facetsPromiseStore);
    let promiseAtAbortTime: unknown;
    const firstSignal = facetOptions(0).signal;
    firstSignal.addEventListener('abort', () => {
      promiseAtAbortTime = get(mockState.facetsPromiseStore);
    });

    searchTerm.set('bmi');
    await load(makeState().state);

    expect(promiseAtAbortTime).not.toBe(firstPromise);
    expect(promiseAtAbortTime).toBe(get(mockState.facetsPromiseStore));
  });
});

describe('criteria classification', () => {
  it('refetches facets on the very first load even with no term and no facets', async () => {
    await load(makeState().state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches facets on a facet click made from a later page', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ currentPage: 1 }).state);
    await load(makeState({ currentPage: 2 }).state);
    await load(makeState({ currentPage: 3 }).state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);

    selectedFacets.set([facet('f1')]);
    await load(makeState({ currentPage: 1 }).state);

    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(2);
  });

  it('treats a reordered but unchanged facet selection as no change', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    const a = facet('a', 'cat', 5);
    const b = facet('b', 'cat', 9);
    selectedFacets.set([a, b]);
    await load(makeState().state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);

    selectedFacets.set([b, a]);
    await load(makeState().state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('distinguishes same-named facets in different categories', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    selectedFacets.set([facet('shared', 'catA')]);
    await load(makeState().state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);

    selectedFacets.set([facet('shared', 'catB')]);
    await load(makeState().state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(2);
  });
});

describe('teardown (via the release callback initHandler returns)', () => {
  it('supersedes an in-flight load and clears the spinner', async () => {
    searchTerm.set('age');
    const d = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(d.promise);

    const { state, setTotalRows } = makeState();
    const promise = load(state);
    expect(get(loading)).toBe(true);

    release();
    expect(get(loading)).toBe(false);

    d.resolve(conceptResponse('a'));
    await expect(promise).resolves.toBeUndefined();
    expect(setTotalRows).not.toHaveBeenCalled();
  });

  it('aborts both in-flight streams', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockReturnValueOnce(deferred<unknown>().promise);
    void load(makeState().state);

    release();

    expect(conceptSignal(0).aborted).toBe(true);
    expect(facetOptions(0).signal.aborted).toBe(true);
  });

  it('neutralises a load that fires after teardown', async () => {
    searchTerm.set('age');
    release();

    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(mockState.searchDictionarySpy).not.toHaveBeenCalled();
    expect(mockState.updateFacetsSpy).not.toHaveBeenCalled();
  });
});

describe('updateFacets', () => {
  it('replaces the selection rather than mutating the array in flight requests hold', async () => {
    const initial = [facet('a'), facet('b')];
    selectedFacets.set(initial);
    const snapshot = [...initial];

    await updateFacets([facet('c')]);

    expect(initial).toEqual(snapshot);
    expect(get(selectedFacets)).not.toBe(initial);
    expect(
      get(selectedFacets)
        .map((f) => f.name)
        .sort(),
    ).toEqual(['a', 'b', 'c']);
  });

  it('removes an already-selected facet without touching the old array', async () => {
    const initial = [facet('a'), facet('b')];
    selectedFacets.set(initial);

    await updateFacets([facet('a')]);

    expect(initial.map((f) => f.name)).toEqual(['a', 'b']);
    expect(get(selectedFacets).map((f) => f.name)).toEqual(['b']);
  });
});

describe('instance lifecycle', () => {
  it('a superseded instance releasing does not tear down its successor', async () => {
    const staleRelease = release;
    const loadSpy = vi.spyOn(tableHandler, 'load').mockImplementation((cb) => {
      load = cb as LoadCallback;
    });
    initHandler();
    loadSpy.mockRestore();

    staleRelease();

    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a'));
    await expect(load(makeState().state)).resolves.toEqual(rows('a'));
  });

  it('the current instance releasing does tear down', async () => {
    release();

    searchTerm.set('age');
    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(mockState.searchDictionarySpy).not.toHaveBeenCalled();
  });

  it('clears a stale error so it cannot leak onto the next page', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));
    await load(makeState().state);
    expect(get(error)).not.toBe('');

    release();

    expect(get(error)).toBe('');
  });

  it('teardown clears published rows and totals', () => {
    tableHandler.rows = rows('leftover');
    tableHandler.totalRows = 42;

    release();

    expect(tableHandler.rows).toEqual([]);
    expect(tableHandler.totalRows).toBe(0);
  });
});

describe('immediate supersession on criteria change', () => {
  it('aborts the in-flight request as soon as criteria change, before the next load', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise);
    const promiseA = load(makeState().state);
    expect(conceptSignal(0).aborted).toBe(false);

    searchTerm.set('bmi');

    expect(conceptSignal(0).aborted).toBe(true);
    dA.resolve(conceptResponse('a'));
    await expect(promiseA).resolves.toBeUndefined();
  });

  it('does not let the in-flight request commit during the debounce window', async () => {
    searchTerm.set('age');
    const dA = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise);
    const { state, setTotalRows } = makeState();
    const promiseA = load(state);

    searchTerm.set('bmi');
    dA.resolve(conceptResponse('a', 99));
    await promiseA;

    expect(setTotalRows).not.toHaveBeenCalled();
  });

  it('keeps the spinner up through the debounce window', () => {
    expect(get(loading)).toBe(false);
    selectedFacets.set([facet('f1')]);
    expect(get(loading)).toBe(true);
  });

  it('does not supersede on pagination, only on criteria change', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    await load(makeState({ currentPage: 1 }).state);

    const facetSignalBefore = facetOptions(0).signal;
    await load(makeState({ currentPage: 2 }).state);

    expect(facetSignalBefore.aborted).toBe(false);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
  });
});

describe('facet failure recovery', () => {
  it('retries facets for unchanged criteria after a facet request fails', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.updateFacetsSpy.mockReturnValueOnce(Promise.reject(new Error('boom')));

    await load(makeState({ currentPage: 1 }).state);
    await flushMicrotasks();
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);

    await load(makeState({ currentPage: 2 }).state);
    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry after a successful facet load', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ currentPage: 1 }).state);
    await flushMicrotasks();
    await load(makeState({ currentPage: 2 }).state);

    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the facet request was merely aborted', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.updateFacetsSpy.mockReturnValueOnce(Promise.reject(abortError));

    await load(makeState({ currentPage: 1 }).state);
    await flushMicrotasks();
    await load(makeState({ currentPage: 2 }).state);

    expect(mockState.updateFacetsSpy).toHaveBeenCalledTimes(1);
  });
});

describe('nextSearchSettled', () => {
  it('resolves once a committed load finishes', async () => {
    searchTerm.set('age');
    const d = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(d.promise);

    let settled = false;
    void nextSearchSettled().then(() => {
      settled = true;
    });

    const promise = load(makeState().state);
    await Promise.resolve();
    expect(settled).toBe(false);

    d.resolve(conceptResponse('a'));
    await promise;
    await Promise.resolve();
    expect(settled).toBe(true);
  });

  it('reports "loaded" for a successful search', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a'));
    const settled = nextSearchSettled();

    await load(makeState().state);

    await expect(settled).resolves.toBe('loaded');
  });

  it('reports "failed" so the tour does not drive over an error alert', async () => {
    searchTerm.set('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));
    const settled = nextSearchSettled();

    await load(makeState().state);

    await expect(settled).resolves.toBe('failed');
  });

  it('reports "cancelled" on teardown so a caller cannot hang', async () => {
    const settled = nextSearchSettled();

    release();

    await expect(settled).resolves.toBe('cancelled');
  });
});
