import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

const mockState = vi.hoisted(() => ({
  searchDictionarySpy: vi.fn(),
  searchFacetsSpy: vi.fn(),
  logSpy: vi.fn(),
}));

vi.mock('#lib/explorer/Dictionary.ts', () => ({
  searchDictionary: mockState.searchDictionarySpy,
  searchFacets: mockState.searchFacetsSpy,
}));

vi.mock('#lib/ui/datatable/rowsPerPage.ts', () => ({
  getDefaultRows: () => 10,
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((category: string, event: string, data?: unknown) => ({
    category,
    event,
    data,
  })),
  getPageContext: () => 'explorer',
}));

import type { State } from '@vincjo/datatables/server';
import type { Facet, SearchResult } from '#lib/explorer/types.ts';
import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
import { ExplorerSearch } from '#lib/explorer/search.svelte.ts';

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

/** The signal handed to searchFacets for the Nth facet request. */
function facetSignal(call: number): AbortSignal {
  return mockState.searchFacetsSpy.mock.calls[call][2].signal;
}

function facetResponse(categoryName: string, zeroCountFacet = 'empty'): DictionaryFacetResult[] {
  return [
    {
      name: categoryName,
      display: categoryName,
      description: '',
      facets: [facet('live', categoryName, 5), facet(zeroCountFacet, categoryName, 0)],
    },
  ];
}

let search: ExplorerSearch;
let load: LoadCallback;
let release: () => void;

// Drives loads directly, bypassing the debounce and the library's scheduling.
function start(): () => void {
  const loadSpy = vi.spyOn(search.table, 'load').mockImplementation((cb) => {
    load = cb as LoadCallback;
  });
  const releaseInstance = search.start();
  loadSpy.mockRestore();
  return releaseInstance;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  mockState.searchDictionarySpy.mockReset();
  mockState.searchFacetsSpy.mockReset().mockImplementation(() => Promise.resolve([]));
  mockState.logSpy.mockClear();

  search = new ExplorerSearch();
  release = start();
});
afterEach(() => {
  vi.mocked(console.error).mockRestore();
  vi.mocked(console.log).mockRestore();
});

describe('concept request race', () => {
  it('drops a superseded response even when it resolves last', async () => {
    search.setTerm('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const { state: stateA } = makeState();
    const promiseA = load(stateA);
    search.setTerm('bmi');
    const { state: stateB } = makeState();
    const promiseB = load(stateB);

    dB.resolve(conceptResponse('b'));
    await expect(promiseB).resolves.toEqual(rows('b'));

    dA.resolve(conceptResponse('a'));
    await expect(promiseA).resolves.toBeUndefined();
  });

  it('drops a superseded response when it resolves first', async () => {
    search.setTerm('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    search.setTerm('bmi');
    const promiseB = load(makeState().state);

    dA.resolve(conceptResponse('a'));
    await expect(promiseA).resolves.toBeUndefined();

    dB.resolve(conceptResponse('b'));
    await expect(promiseB).resolves.toEqual(rows('b'));
  });

  it('aborts the previous concept request when a new load starts', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockReturnValue(deferred<unknown>().promise);

    void load(makeState().state);
    expect(conceptSignal(0).aborted).toBe(false);

    search.setTerm('bmi');
    void load(makeState().state);

    expect(conceptSignal(0).aborted).toBe(true);
    expect(conceptSignal(1).aborted).toBe(false);
  });

  it('does not let a superseded response write totalRows', async () => {
    search.setTerm('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const { state: stateA, setTotalRows: setTotalRowsA } = makeState();
    const promiseA = load(stateA);
    search.setTerm('bmi');
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
    search.setTerm('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    search.setTerm('bmi');
    const promiseB = load(makeState().state);
    expect(search.loading).toBe(true);

    dA.resolve(conceptResponse('a'));
    await promiseA;
    expect(search.loading).toBe(true);

    dB.resolve(conceptResponse('b'));
    await promiseB;
    expect(search.loading).toBe(false);
  });

  it('logs the term the request was built with', async () => {
    search.setTerm('age');
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
    search.setTerm('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    search.setTerm('bmi');
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
    search.setTerm('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));

    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(search.error).not.toBe('');
  });

  it('does not surface an error from a superseded failure', async () => {
    search.setTerm('age');
    const dA = deferred<unknown>();
    const dB = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = load(makeState().state);
    search.setTerm('bmi');
    const promiseB = load(makeState().state);

    dB.resolve(conceptResponse('b'));
    await promiseB;
    dA.reject(new Error('late failure'));
    await promiseA;

    expect(search.error).toBe('');
  });

  it('does not surface an error when a request is aborted', async () => {
    search.setTerm('age');
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.searchDictionarySpy.mockRejectedValueOnce(abortError);

    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(search.error).toBe('');
  });

  it('clears a stale error at the start of the next load - including a facet click', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));
    await load(makeState().state);
    expect(search.error).not.toBe('');

    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a'));
    search.setFacets([facet('f1')]);
    await load(makeState().state);
    expect(search.error).toBe('');
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
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ currentPage: 1 }).state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
    await load(makeState({ currentPage: 2 }).state);

    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
    expect(facetSignal(0).aborted).toBe(false);
  });

  it('a rows-per-page change does not refetch facets', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ rowsPerPage: 10 }).state);
    await load(makeState({ rowsPerPage: 25 }).state);

    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('a criteria change supersedes and aborts the previous facet request', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    const stale = deferred<DictionaryFacetResult[]>();
    mockState.searchFacetsSpy
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(facetResponse('current'));

    await load(makeState().state);
    search.setTerm('bmi');
    await load(makeState().state);
    await flushMicrotasks();

    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(2);
    expect(facetSignal(0).aborted).toBe(true);
    stale.resolve(facetResponse('stale'));
    await flushMicrotasks();
    expect(search.facetCategories?.map((c) => c.name)).toEqual(['current']);
    expect(search.openFacets).toEqual(['current']);
  });
});

describe('facet sidebar state', () => {
  it('commits the categories, hidden facets and open categories of a response', async () => {
    mockState.searchFacetsSpy.mockResolvedValueOnce(facetResponse('demographics'));

    await load(makeState().state);
    await flushMicrotasks();

    expect(search.facetCategories?.map((c) => c.name)).toEqual(['demographics']);
    expect(search.hiddenFacets).toEqual({ demographics: ['empty'] });
    expect(search.openFacets).toEqual(['demographics']);
  });

  it('keeps the committed tree in place while a refetch runs', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.searchFacetsSpy
      .mockResolvedValueOnce(facetResponse('demographics'))
      .mockReturnValueOnce(deferred<DictionaryFacetResult[]>().promise);
    await load(makeState().state);
    await flushMicrotasks();
    const committed = search.facetCategories;

    search.setFacets([facet('live', 'demographics', 5)]);
    await load(makeState().state);

    expect(search.facetCategories).toBe(committed);
  });

  it('shows no tree until the first response arrives', () => {
    expect(search.facetCategories).toBeUndefined();
  });

  it('leaves the accordion alone when the same categories come back', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.searchFacetsSpy.mockImplementation(() =>
      Promise.resolve(facetResponse('demographics')),
    );
    await load(makeState().state);
    await flushMicrotasks();
    search.setOpenFacets([]);

    search.setTerm('age');
    await load(makeState().state);
    await flushMicrotasks();

    expect(search.openFacets).toEqual([]);
  });

  it('auto-opens again once the set of categories with results changes', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.searchFacetsSpy
      .mockResolvedValueOnce(facetResponse('demographics'))
      .mockResolvedValueOnce(facetResponse('measurements'));
    await load(makeState().state);
    await flushMicrotasks();
    search.setOpenFacets([]);

    search.setTerm('age');
    await load(makeState().state);
    await flushMicrotasks();

    expect(search.openFacets).toEqual(['measurements']);
  });

  it('auto-opens again after a restart', async () => {
    mockState.searchFacetsSpy.mockImplementation(() =>
      Promise.resolve(facetResponse('demographics')),
    );
    await load(makeState().state);
    await flushMicrotasks();
    search.setOpenFacets([]);

    release = start();
    await load(makeState().state);
    await flushMicrotasks();

    expect(search.openFacets).toEqual(['demographics']);
  });

  it('reports a failed facet request until the next criteria change', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.searchFacetsSpy.mockRejectedValueOnce(new Error('boom'));
    await load(makeState().state);
    await flushMicrotasks();
    expect(search.facetsFailed).toBe(true);

    search.setTerm('age');
    await load(makeState().state);

    expect(search.facetsFailed).toBe(false);
  });

  it('gives selected facets the counts of the latest response', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.searchFacetsSpy.mockResolvedValueOnce(facetResponse('demographics'));
    search.setFacets([facet('live', 'demographics', 9), facet('gone', 'demographics', 3)]);

    await load(makeState().state);
    await flushMicrotasks();

    expect(search.selectedFacets.map((f) => [f.name, f.count])).toEqual([
      ['live', 5],
      ['gone', 0],
    ]);
  });

  it('toggles a nested facet open and closed', () => {
    search.toggleNestedFacet('key');
    expect(search.expandedNestedFacets).toEqual(['key']);
    search.toggleNestedFacet('key');
    expect(search.expandedNestedFacets).toEqual([]);
  });
});

describe('criteria classification', () => {
  it('refetches facets on the very first load even with no term and no facets', async () => {
    await load(makeState().state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches facets on a facet click made from a later page', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ currentPage: 1 }).state);
    await load(makeState({ currentPage: 2 }).state);
    await load(makeState({ currentPage: 3 }).state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);

    search.setFacets([facet('f1')]);
    await load(makeState({ currentPage: 1 }).state);

    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(2);
  });

  it('treats a reordered but unchanged facet selection as no change', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    const a = facet('a', 'cat', 5);
    const b = facet('b', 'cat', 9);
    search.setFacets([a, b]);
    await load(makeState().state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);

    search.setFacets([b, a]);
    await load(makeState().state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('distinguishes same-named facets in different categories', async () => {
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    search.setFacets([facet('shared', 'catA')]);
    await load(makeState().state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);

    search.setFacets([facet('shared', 'catB')]);
    await load(makeState().state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(2);
  });
});

describe('teardown (via the release callback start returns)', () => {
  it('supersedes an in-flight load and clears the spinner', async () => {
    search.setTerm('age');
    const d = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(d.promise);

    const { state, setTotalRows } = makeState();
    const promise = load(state);
    expect(search.loading).toBe(true);

    release();
    expect(search.loading).toBe(false);

    d.resolve(conceptResponse('a'));
    await expect(promise).resolves.toBeUndefined();
    expect(setTotalRows).not.toHaveBeenCalled();
  });

  it('aborts both in-flight streams', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockReturnValueOnce(deferred<unknown>().promise);
    void load(makeState().state);

    release();

    expect(conceptSignal(0).aborted).toBe(true);
    expect(facetSignal(0).aborted).toBe(true);
  });

  it('neutralises a load that fires after teardown', async () => {
    search.setTerm('age');
    release();

    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(mockState.searchDictionarySpy).not.toHaveBeenCalled();
    expect(mockState.searchFacetsSpy).not.toHaveBeenCalled();
  });
});

describe('toggleFacets', () => {
  it('replaces the selection rather than mutating the array in flight requests hold', async () => {
    const initial = [facet('a'), facet('b')];
    search.setFacets(initial);
    const snapshot = [...initial];

    search.toggleFacets([facet('c')]);

    expect(initial).toEqual(snapshot);
    expect(search.selectedFacets).not.toBe(initial);
    expect(search.selectedFacets.map((f) => f.name).sort()).toEqual(['a', 'b', 'c']);
  });

  it('removes an already-selected facet without touching the old array', async () => {
    const initial = [facet('a'), facet('b')];
    search.setFacets(initial);

    search.toggleFacets([facet('a')]);

    expect(initial.map((f) => f.name)).toEqual(['a', 'b']);
    expect(search.selectedFacets.map((f) => f.name)).toEqual(['b']);
  });
});

describe('instance lifecycle', () => {
  it('a superseded instance releasing does not tear down its successor', async () => {
    const staleRelease = release;
    start();

    staleRelease();

    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a'));
    await expect(load(makeState().state)).resolves.toEqual(rows('a'));
  });

  it('the current instance releasing does tear down', async () => {
    release();

    search.setTerm('age');
    await expect(load(makeState().state)).resolves.toBeUndefined();
    expect(mockState.searchDictionarySpy).not.toHaveBeenCalled();
  });

  it('clears a stale error so it cannot leak onto the next page', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));
    await load(makeState().state);
    expect(search.error).not.toBe('');

    release();

    expect(search.error).toBe('');
  });

  it('teardown clears published rows and totals', () => {
    search.table.rows = rows('leftover');
    search.table.totalRows = 42;

    release();

    expect(search.table.rows).toEqual([]);
    expect(search.table.totalRows).toBe(0);
  });
});

describe('immediate supersession on criteria change', () => {
  it('aborts the in-flight request as soon as criteria change, before the next load', async () => {
    search.setTerm('age');
    const dA = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise);
    const promiseA = load(makeState().state);
    expect(conceptSignal(0).aborted).toBe(false);

    search.setTerm('bmi');

    expect(conceptSignal(0).aborted).toBe(true);
    dA.resolve(conceptResponse('a'));
    await expect(promiseA).resolves.toBeUndefined();
  });

  it('does not let the in-flight request commit during the debounce window', async () => {
    search.setTerm('age');
    const dA = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(dA.promise);
    const { state, setTotalRows } = makeState();
    const promiseA = load(state);

    search.setTerm('bmi');
    dA.resolve(conceptResponse('a', 99));
    await promiseA;

    expect(setTotalRows).not.toHaveBeenCalled();
  });

  it('keeps the spinner up through the debounce window', () => {
    expect(search.loading).toBe(false);
    search.setFacets([facet('f1')]);
    expect(search.loading).toBe(true);
  });

  it('does not supersede on pagination, only on criteria change', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    await load(makeState({ currentPage: 1 }).state);

    await load(makeState({ currentPage: 2 }).state);

    expect(facetSignal(0).aborted).toBe(false);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
  });
});

describe('facet failure recovery', () => {
  it('retries facets for unchanged criteria after a facet request fails', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    mockState.searchFacetsSpy.mockReturnValueOnce(Promise.reject(new Error('boom')));

    await load(makeState({ currentPage: 1 }).state);
    await flushMicrotasks();
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);

    await load(makeState({ currentPage: 2 }).state);
    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry after a successful facet load', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));

    await load(makeState({ currentPage: 1 }).state);
    await flushMicrotasks();
    await load(makeState({ currentPage: 2 }).state);

    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the facet request was merely aborted', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValue(conceptResponse('a'));
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockState.searchFacetsSpy.mockReturnValueOnce(Promise.reject(abortError));

    await load(makeState({ currentPage: 1 }).state);
    await flushMicrotasks();
    await load(makeState({ currentPage: 2 }).state);

    expect(mockState.searchFacetsSpy).toHaveBeenCalledTimes(1);
  });
});

describe('nextSettled', () => {
  it('resolves once a committed load finishes', async () => {
    search.setTerm('age');
    const d = deferred<unknown>();
    mockState.searchDictionarySpy.mockReturnValueOnce(d.promise);

    let settled = false;
    void search.nextSettled().then(() => {
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
    search.setTerm('age');
    mockState.searchDictionarySpy.mockResolvedValueOnce(conceptResponse('a'));
    const settled = search.nextSettled();

    await load(makeState().state);

    await expect(settled).resolves.toBe('loaded');
  });

  it('reports "failed" so the tour does not drive over an error alert', async () => {
    search.setTerm('age');
    mockState.searchDictionarySpy.mockRejectedValueOnce(new Error('boom'));
    const settled = search.nextSettled();

    await load(makeState().state);

    await expect(settled).resolves.toBe('failed');
  });

  it('reports "cancelled" on teardown so a caller cannot hang', async () => {
    const settled = search.nextSettled();

    release();

    await expect(settled).resolves.toBe('cancelled');
  });
});
