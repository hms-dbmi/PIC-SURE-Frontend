import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { get, notReady } = vi.hoisted(() => ({
  get: vi.fn(),
  notReady: { status: 409, body: { message: '{"errorType":"result_not_ready"}' } },
}));

vi.mock('$lib/api', () => ({ get, isResultNotReady: (e: unknown) => e === notReady }));

import { fetchWhenReady, isExportFailure, waitUntilAvailable } from '$lib/services/exportStatus';

const STATUS_PATH = 'picsure/hpds/auth/query/query-1/status';
const LAST_ATTEMPT_AT_MS = 500 + 1000 + 2000 + 4000 + 8000 + 16000 + 32000 + 7 * 60000;

describe('waitUntilAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves when status becomes AVAILABLE', async () => {
    get
      .mockResolvedValueOnce({ status: 'PENDING' })
      .mockResolvedValueOnce({ status: 'QUEUED' })
      .mockResolvedValueOnce({ status: 'AVAILABLE' });

    const waiting = waitUntilAvailable('query-1');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(waiting).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(3);
    expect(get).toHaveBeenCalledWith('picsure/hpds/auth/query/query-1/status');
  });

  it('resolves at once when status is SUCCESS', async () => {
    get.mockResolvedValueOnce({ status: 'SUCCESS' });

    await expect(waitUntilAvailable('query-1')).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('stops on ERROR', async () => {
    get.mockResolvedValue({ status: 'ERROR' });

    const failure = await waitUntilAvailable('query-1').catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe('Export failed with status: ERROR');
    expect(isExportFailure(failure)).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps polling after a failed status request', async () => {
    get.mockRejectedValueOnce(new Error('502')).mockResolvedValueOnce({ status: 'AVAILABLE' });

    const waiting = waitUntilAvailable('query-1');
    await vi.advanceTimersByTimeAsync(1000);

    await expect(waiting).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('waits 500 ms after the first attempt and doubles up to a 60000 ms cap', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    get.mockResolvedValue({ status: 'PENDING' });

    const outcome = waitUntilAvailable('query-1').catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(499);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(63000);
    expect(get).toHaveBeenCalledTimes(8);
    await vi.advanceTimersByTimeAsync(59999);
    expect(get).toHaveBeenCalledTimes(8);
    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(9);

    await vi.advanceTimersByTimeAsync(11 * 60000);
    await outcome;
  });

  it('gives up after 15 attempts and rejects with the last status error', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    get.mockResolvedValue({ status: 'PENDING' });
    let failure: unknown;
    void waitUntilAvailable('query-1').catch((e: unknown) => (failure = e));

    await vi.advanceTimersByTimeAsync(LAST_ATTEMPT_AT_MS - 1);
    expect(get).toHaveBeenCalledTimes(14);
    expect(failure).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(15);
    expect(failure).toEqual(new Error('Export not ready. Status: PENDING'));
    expect(isExportFailure(failure)).toBe(false);

    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(get).toHaveBeenCalledTimes(15);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with the last request error when the attempts run out on a failed request', async () => {
    const unreachable = new Error('502');
    get.mockRejectedValue(unreachable);

    const outcome = waitUntilAvailable('query-1').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(11 * 60000);

    expect(await outcome).toBe(unreachable);
    expect(get).toHaveBeenCalledTimes(15);
  });

  it('stops polling when the signal aborts', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({ status: 'PENDING' });

    const outcome = waitUntilAvailable('query-1', controller.signal).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(700);
    expect(get).toHaveBeenCalledTimes(2);
    controller.abort();

    expect(((await outcome) as Error).name).toBe('AbortError');
    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledWith(STATUS_PATH, undefined, undefined, {
      signal: controller.signal,
    });
  });
});

describe('fetchWhenReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends no retry when the signal aborts during the status wait', async () => {
    const controller = new AbortController();
    const fetchResult = vi.fn().mockRejectedValue(notReady);
    get.mockResolvedValue({ status: 'PENDING' });

    const outcome = fetchWhenReady('query-1', fetchResult, controller.signal).catch(
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();

    expect(((await outcome) as Error).name).toBe('AbortError');
    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(fetchResult).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('sends no retry when the signal aborts as the export becomes available', async () => {
    const controller = new AbortController();
    const fetchResult = vi.fn().mockRejectedValue(notReady);
    get.mockImplementation(async () => {
      controller.abort();
      return { status: 'AVAILABLE' };
    });

    const failure = await fetchWhenReady('query-1', fetchResult, controller.signal).catch(
      (e: unknown) => e,
    );

    expect((failure as Error).name).toBe('AbortError');
    expect(fetchResult).toHaveBeenCalledTimes(1);
  });
});

describe('isExportFailure', () => {
  it('is false for a status that is only not ready yet', () => {
    expect(isExportFailure(new Error('Export not ready. Status: PENDING'))).toBe(false);
    expect(isExportFailure(undefined)).toBe(false);
  });
});
