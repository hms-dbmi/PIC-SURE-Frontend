import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { withBackoff } from '$lib/utilities/backoff';

describe('withBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries up to the attempt limit and rejects with the last error without a signal', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValueOnce(new Error('third'));

    const outcome = withBackoff(fn, 3, 100, 1000).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(300);

    expect(await outcome).toEqual(new Error('third'));
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('makes no attempt when the signal has already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn().mockResolvedValue('done');

    const failure = await withBackoff(fn, 3, 100, 1000, undefined, controller.signal).catch(
      (e: unknown) => e,
    );

    expect((failure as Error).name).toBe('AbortError');
    expect(fn).not.toHaveBeenCalled();
  });

  it('ends the delay and stops retrying when the signal aborts', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error('not yet'));

    const outcome = withBackoff(fn, 5, 1000, 30000, undefined, controller.signal).catch(
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(500);
    expect(fn).toHaveBeenCalledTimes(1);
    controller.abort();

    expect(((await outcome) as Error).name).toBe('AbortError');
    await vi.advanceTimersByTimeAsync(120000);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with the abort reason when the signal aborts during an attempt', async () => {
    const controller = new AbortController();
    const reason = new Error('left the page');
    const shouldRetry = vi.fn(() => true);
    const fn = vi.fn(async () => {
      controller.abort(reason);
      throw new Error('request cancelled');
    });

    const failure = await withBackoff(fn, 5, 1000, 30000, shouldRetry, controller.signal).catch(
      (e: unknown) => e,
    );

    expect(failure).toBe(reason);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).not.toHaveBeenCalled();
  });

  it('keeps retrying while the signal stays open', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValueOnce(new Error('not yet')).mockResolvedValueOnce('done');

    const outcome = withBackoff(fn, 3, 100, 1000, undefined, controller.signal);
    await vi.advanceTimersByTimeAsync(100);

    await expect(outcome).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
