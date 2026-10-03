// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiGet = vi.hoisted(() => vi.fn());

vi.mock('$lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/api')>()),
  get: apiGet,
}));

vi.mock('$lib/logger', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
}));

import { loadLongTermToken } from '$lib/stores/User';

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('loadLongTermToken', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it('shares one request between concurrent callers', async () => {
    const request = deferred();
    apiGet.mockReturnValue(request.promise);

    const first = loadLongTermToken();
    const second = loadLongTermToken();
    request.resolve({ token: 'a' });
    await Promise.all([first, second]);

    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('fetches again when called after a request succeeds', async () => {
    apiGet.mockResolvedValue({ token: 'a' });

    await loadLongTermToken();
    await loadLongTermToken();

    expect(apiGet).toHaveBeenCalledTimes(2);
    apiGet.mock.calls.forEach(([path]) => expect(path).toContain('hasToken'));
  });

  it('fetches again when called after a request fails', async () => {
    apiGet.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce({ token: 'a' });

    await expect(loadLongTermToken()).rejects.toThrow('down');
    await expect(loadLongTermToken()).resolves.toBeUndefined();

    expect(apiGet).toHaveBeenCalledTimes(2);
  });
});
