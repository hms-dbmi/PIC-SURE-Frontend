import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withBackoff } from '#lib/utils/backoff.ts';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  // Math.random() = 0.5 makes the ±25% jitter zero.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Fails `failures` times, then resolves 'ok'; records the fake clock at each call.
function flaky(failures: number) {
  const times: number[] = [];
  const fn = vi.fn(async () => {
    times.push(Date.now());
    if (times.length <= failures) throw new Error(`fail ${times.length}`);
    return 'ok';
  });
  return { fn, times };
}

describe('withBackoff', () => {
  it.each([
    { name: 'first try', failures: 0, args: [], delays: [] },
    { name: 'default delays double from 1s', failures: 2, args: [], delays: [1000, 2000] },
    { name: 'custom base delay', failures: 3, args: [5, 100], delays: [100, 200, 400] },
    {
      name: 'delays capped at maxDelay',
      failures: 3,
      args: [5, 1000, 1500],
      delays: [1000, 1500, 1500],
    },
  ])('resolves after retrying: $name', async ({ failures, args, delays }) => {
    const start = Date.now();
    const { fn, times } = flaky(failures);

    const result = withBackoff(fn, ...(args as [number?, number?, number?]));
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe('ok');
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    expect(times[0]).toBe(start);
    expect(gaps).toEqual(delays);
    expect(console.warn).toHaveBeenCalledTimes(failures);
  });

  it.each([
    { random: 0, delay: 750 },
    { random: 1, delay: 1250 },
  ])('adds up to ±25% jitter (random $random → $delay ms)', async ({ random, delay }) => {
    vi.mocked(Math.random).mockReturnValue(random);
    const { fn, times } = flaky(1);

    const result = withBackoff(fn);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe('ok');
    expect(times[1] - times[0]).toBe(delay);
  });

  it('rejects with the last error after maxAttempts, without a final delay', async () => {
    const start = Date.now();
    const { fn, times } = flaky(5);

    const result = withBackoff(fn, 3).catch((e: Error) => e.message);
    await vi.runAllTimersAsync();

    expect(await result).toBe('fail 3');
    expect(times.map((t) => t - start)).toEqual([0, 1000, 3000]);
    expect(Date.now() - start).toBe(3000);
  });

  it('stops when shouldRetry says no, passing the error and attempt', async () => {
    const { fn } = flaky(5);
    const shouldRetry = vi.fn((_error: unknown, attempt: number) => attempt < 1);

    const result = withBackoff(fn, 5, 10, 100, shouldRetry).catch((e: Error) => e.message);
    await vi.runAllTimersAsync();

    expect(await result).toBe('fail 2');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(shouldRetry.mock.calls).toEqual([
      [new Error('fail 1'), 0],
      [new Error('fail 2'), 1],
    ]);
  });

  it('rejects with undefined and never calls fn when maxAttempts is 0', async () => {
    const { fn } = flaky(0);

    await expect(withBackoff(fn, 0)).rejects.toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });
});
