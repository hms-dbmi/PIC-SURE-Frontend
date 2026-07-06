import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const mockState = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writable } = require('svelte/store') as typeof import('svelte/store');
  return {
    toasterErrorSpy: vi.fn(),
    isToastShowingSpy: vi.fn().mockReturnValue(false),
    loadResourcesSpy: vi.fn(),
    getCountResourceSpy: vi.fn().mockReturnValue({ name: 'hpds', uuid: 'r1' }),
    logSpy: vi.fn(),
    buildDescriptorSpy: vi.fn((inputs: { isOpenAccess: boolean }) => ({
      isOpenAccess: inputs.isOpenAccess,
      phenotypicClause: null,
      genomicFilters: [],
    })),
    allFiltersStore: writable<unknown[]>([]),
    filterTreeStore: writable<unknown>({ root: { children: [] } }),
    genomicFiltersStore: writable<unknown[]>([]),
    resourcesLoadingStore: writable(Promise.resolve()),
  };
});

vi.mock('$lib/toaster', () => ({
  toaster: { error: mockState.toasterErrorSpy },
  isToastShowing: mockState.isToastShowingSpy,
}));

vi.mock('$lib/stores/Filter', () => ({
  allFilters: mockState.allFiltersStore,
  filterTree: mockState.filterTreeStore,
  genomicFilters: mockState.genomicFiltersStore,
}));

vi.mock('$lib/stores/Resources', () => ({
  loading: mockState.resourcesLoadingStore,
  loadResources: mockState.loadResourcesSpy,
  getCountResource: mockState.getCountResourceSpy,
}));

vi.mock('$lib/logger', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((category: string, event: string, data?: unknown) => ({
    category,
    event,
    data,
  })),
}));

vi.mock('$lib/services/counts/queryDescriptor.svelte', () => ({
  buildDescriptor: mockState.buildDescriptorSpy,
  stableHash: () => 'k',
}));

vi.mock('$lib/services/counts/providers', () => ({
  resultProviders: { 'query:patientCount': { id: 'query:patientCount' } },
}));

import type { ResultCountSnapshot } from '$lib/services/counts/snapshot';
import type { QueryCountService } from '$lib/services/counts/QueryCountService';
import type { QueryDescriptor } from '$lib/services/counts/queryDescriptor.svelte';
import { ResultCounts } from '$lib/state/resultCounts.svelte';

const descriptor: QueryDescriptor = {
  isOpenAccess: false,
  phenotypicClause: null,
  genomicFilters: [],
};

function snapshot(total: number, hasError = false): ResultCountSnapshot {
  return {
    descriptorKey: `k-${total}`,
    count: total,
    summary: { total, hasNonZero: total !== 0, hasError },
  };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await new Promise<void>((r) => r());
}

type MockService = QueryCountService & {
  getCount: ReturnType<typeof vi.fn>;
};

function makeMockService(): MockService {
  return {
    getCount: vi.fn(),
    clear: vi.fn(),
  } as never;
}

describe('ResultCounts', () => {
  let mockService: MockService;
  let state: ResultCounts;

  beforeEach(() => {
    mockService = makeMockService();
    state = new ResultCounts(mockService);
    mockState.toasterErrorSpy.mockClear();
    mockState.isToastShowingSpy.mockClear().mockReturnValue(false);
    mockState.loadResourcesSpy.mockClear();
    mockState.getCountResourceSpy.mockClear().mockReturnValue({ name: 'hpds', uuid: 'r1' });
    mockState.logSpy.mockClear();
    mockState.buildDescriptorSpy.mockClear();
    mockState.allFiltersStore.set([]);
  });

  it('starts in the idle status with an empty snapshot', () => {
    expect(state.status).toBe('idle');
    expect(state.snapshot.summary.total).toBe(0);
    expect(state.snapshot.summary.hasNonZero).toBe(false);
    expect(state.snapshot.summary.hasError).toBe(false);
  });

  it('transitions idle → loading → loaded on a successful load', async () => {
    const d = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(d.promise);

    const loadPromise = state.load(descriptor, false);
    expect(state.status).toBe('loading');

    d.resolve(snapshot(1234));
    await loadPromise;
    expect(state.status).toBe('loaded');
    expect(state.snapshot.summary.total).toBe(1234);
  });

  it('returns { kind: "committed", snapshot } on success', async () => {
    const s = snapshot(42);
    mockService.getCount.mockResolvedValueOnce(s);
    const result = await state.load(descriptor, false);
    expect(result).toEqual({ kind: 'committed', snapshot: s });
  });

  it('transitions to "error" when the service returns a hasError snapshot', async () => {
    const s = snapshot(0, true);
    mockService.getCount.mockResolvedValueOnce(s);
    const result = await state.load(descriptor, false);
    expect(state.status).toBe('error');
    expect(result).toEqual({ kind: 'error', snapshot: s });
  });

  it('transitions to "error" when the service rejects', async () => {
    mockService.getCount.mockRejectedValueOnce(new Error('boom'));
    const result = await state.load(descriptor, false);
    expect(state.status).toBe('error');
    expect(result.kind).toBe('error');
  });

  it('recovers from error to loaded on a subsequent successful load', async () => {
    mockService.getCount.mockRejectedValueOnce(new Error('boom'));
    await state.load(descriptor, false);
    expect(state.status).toBe('error');

    mockService.getCount.mockResolvedValueOnce(snapshot(7));
    await state.load(descriptor, false);
    expect(state.status).toBe('loaded');
    expect(state.snapshot.summary.total).toBe(7);
  });

  it('drops a stale result when a newer load() has been started — latest wins regardless of completion order', async () => {
    const dA = deferred<ResultCountSnapshot>();
    const dB = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = state.load(descriptor, false);
    const promiseB = state.load(descriptor, false);

    dB.resolve(snapshot(2222));
    const resultB = await promiseB;
    expect(resultB).toEqual({ kind: 'committed', snapshot: snapshot(2222) });
    expect(state.snapshot.summary.total).toBe(2222);

    dA.resolve(snapshot(1111));
    const resultA = await promiseA;
    expect(resultA).toEqual({ kind: 'stale' });
    expect(state.snapshot.summary.total).toBe(2222);
  });

  it('drops a stale result even when the older request completes second', async () => {
    const dA = deferred<ResultCountSnapshot>();
    const dB = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = state.load(descriptor, false);
    const promiseB = state.load(descriptor, false);

    dA.resolve(snapshot(1111));
    await promiseA;
    expect(state.snapshot.summary.total).toBe(0);

    dB.resolve(snapshot(2222));
    await promiseB;
    expect(state.snapshot.summary.total).toBe(2222);
  });

  it('drops a stale rejection (a newer load supersedes an older failure)', async () => {
    const dA = deferred<ResultCountSnapshot>();
    const dB = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = state.load(descriptor, false);
    const promiseB = state.load(descriptor, false);

    dB.resolve(snapshot(2222));
    await promiseB;
    expect(state.status).toBe('loaded');

    dA.reject(new Error('late failure'));
    await promiseA;
    expect(state.status).toBe('loaded');
    expect(state.snapshot.summary.total).toBe(2222);
  });

  it('queries the single count resource resolved by getCountResource', async () => {
    mockService.getCount.mockResolvedValueOnce(snapshot(42));
    await state.load(descriptor, true);
    expect(mockState.getCountResourceSpy).toHaveBeenCalledWith(true);
    expect(mockService.getCount).toHaveBeenCalledWith(descriptor, expect.anything(), {
      name: 'hpds',
      uuid: 'r1',
    });
  });

  it('logs query.count_returned when a snapshot commits', async () => {
    mockService.getCount.mockResolvedValueOnce(snapshot(42));
    await state.load(descriptor, false);
    expect(mockState.logSpy).toHaveBeenCalledWith({
      category: 'QUERY',
      event: 'query.count_returned',
      data: { count: 42 },
    });
  });

  it('does not log query.count_returned for a stale (superseded) load', async () => {
    const dA = deferred<ResultCountSnapshot>();
    const dB = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    const promiseA = state.load(descriptor, false);
    const promiseB = state.load(descriptor, false);

    dB.resolve(snapshot(2222));
    await promiseB;
    dA.resolve(snapshot(1111));
    await promiseA;

    expect(mockState.logSpy).toHaveBeenCalledTimes(1);
    expect(mockState.logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'query.count_returned', data: { count: 2222 } }),
    );
  });

  it('clear() resets snapshot + status and forwards to service.clear()', () => {
    state.clear();
    expect(state.status).toBe('idle');
    expect(state.snapshot.summary.total).toBe(0);
    expect(mockService.clear).toHaveBeenCalled();
  });

  it('clear() called while a load is in flight: in-flight resolves as stale and status stays idle', async () => {
    const d = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(d.promise);

    const loadPromise = state.load(descriptor, false);
    expect(state.status).toBe('loading');

    state.clear();
    expect(state.status).toBe('idle');

    d.resolve(snapshot(9999));
    const result = await loadPromise;

    expect(result).toEqual({ kind: 'stale' });
    expect(state.status).toBe('idle');
    expect(state.snapshot.summary.total).toBe(0);
  });

  it('exposes convenience getters that proxy snapshot.summary', async () => {
    mockService.getCount.mockResolvedValueOnce(snapshot(42));
    await state.load(descriptor, false);
    expect(state.total).toBe(42);
    expect(state.hasNonZero).toBe(true);
    expect(state.loading).toBe(false);
  });

  it('loading getter is true while a fetch is in flight', () => {
    const d = deferred<ResultCountSnapshot>();
    mockService.getCount.mockReturnValueOnce(d.promise);
    void state.load(descriptor, false);
    expect(state.loading).toBe(true);
  });

  describe('start / stop lifecycle', () => {
    afterEach(() => {
      state.stop();
    });

    it('start() fires an initial load immediately', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
    });

    it('start() reloads on each filter change', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
      mockState.allFiltersStore.set([{} as unknown]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockService.getCount).toHaveBeenCalledTimes(2);
    });

    it('stop() unsubscribes; further filter changes do not trigger load', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      state.stop();
      mockState.allFiltersStore.set([{} as unknown]);
      await flushMicrotasks();
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
    });

    it('start() reads the current getIsOpenAccess() value on every load', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      let auth = true;
      state.start(() => !auth);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockState.buildDescriptorSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpenAccess: false }),
      );
      auth = false;
      mockState.allFiltersStore.set([{} as unknown]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockState.buildDescriptorSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpenAccess: true }),
      );
    });

    it('calling start() twice without stop() does not double-subscribe', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      state.start(() => true);
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      mockState.allFiltersStore.set([{} as unknown]);
      await flushMicrotasks();
      await flushMicrotasks();
      // 2 initial fires (one per start) + 1 filter-change fire = 3
      expect(mockService.getCount).toHaveBeenCalledTimes(3);
    });

    it('stop() called between start() and snapshot resolution does not commit or fire a toast', async () => {
      const d = deferred<ResultCountSnapshot>();
      mockService.getCount.mockReturnValueOnce(d.promise);
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      state.stop();
      d.resolve(snapshot(9999));
      await flushMicrotasks();
      await flushMicrotasks();
      expect(state.snapshot.summary.total).toBe(0);
      expect(mockState.toasterErrorSpy).not.toHaveBeenCalled();
    });

    it('on load error fires a toast once; does not refire while a toast is showing', async () => {
      mockService.getCount
        .mockResolvedValueOnce(snapshot(0, true))
        .mockResolvedValueOnce(snapshot(0, true));
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockState.toasterErrorSpy).toHaveBeenCalledTimes(1);

      mockState.isToastShowingSpy.mockReturnValue(true);
      mockState.allFiltersStore.set([{} as unknown]);
      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockState.toasterErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('stop() mid-flight resets status to "idle" so spinners do not get stuck', async () => {
      const d = deferred<ResultCountSnapshot>();
      mockService.getCount.mockReturnValueOnce(d.promise);
      state.start(() => true);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(state.status).toBe('loading');
      state.stop();
      expect(state.status).toBe('idle');
      d.resolve(snapshot(42));
      await flushMicrotasks();
      await flushMicrotasks();
      expect(state.status).toBe('idle');
    });
  });

  describe('triggerLoad', () => {
    it('fires a one-shot load without installing a subscription', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      await state.triggerLoad(() => true);
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
      mockState.allFiltersStore.set([{} as unknown]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
    });

    it('respects the passed getIsOpenAccess on the build', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      await state.triggerLoad(() => true);
      expect(mockState.buildDescriptorSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpenAccess: true }),
      );
    });
  });

  describe('ensureLoaded', () => {
    const fixedSnapshot: ResultCountSnapshot = {
      descriptorKey: 'k',
      count: 42,
      summary: { total: 42, hasNonZero: true, hasError: false },
    };

    it('fires a load when the current snapshot.descriptorKey does not match', async () => {
      mockService.getCount.mockResolvedValue(snapshot(42));
      await state.ensureLoaded(() => true);
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
    });

    it('skips the load when the current snapshot already matches', async () => {
      mockService.getCount.mockResolvedValueOnce(fixedSnapshot);
      await state.ensureLoaded(() => true);
      expect(mockService.getCount).toHaveBeenCalledTimes(1);

      await state.ensureLoaded(() => true);
      expect(mockService.getCount).toHaveBeenCalledTimes(1);
    });
  });
});
