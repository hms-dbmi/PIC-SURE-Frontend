import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('$lib/api', () => ({ get }));

import { isExportFailure, waitUntilAvailable } from '$lib/services/exportStatus';

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
});

describe('isExportFailure', () => {
  it('is false for a status that is only not ready yet', () => {
    expect(isExportFailure(new Error('Export not ready. Status: PENDING'))).toBe(false);
    expect(isExportFailure(undefined)).toBe(false);
  });
});
