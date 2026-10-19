// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

const mockApi = vi.hoisted(() => ({ request: vi.fn() }));
const mockToaster = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { explorer: { open: false }, login: { open: false } } },
}));
vi.mock('#lib/api/client.ts', () => mockApi);
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: mockToaster, isToastShowing: () => false }));

import {
  ACCESS_UNAVAILABLE_MESSAGE,
  accessUnavailable,
  clearSession,
  ensureConsentsLoaded,
  getConsents,
  loadConsents,
  removeToken,
  setToken,
  showAccessUnavailable,
  user,
} from '#lib/auth/User.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { addConsents } from '#lib/explorer/Dictionary.ts';
import { Psama } from '#lib/api/paths.ts';
import { ApiError } from '#lib/api/errors.ts';

const consents = {
  '\\_consents\\': ['phs001', 'phs002'],
  '\\_harmonized_consent\\': ['phs001'],
};

const blankRequest = () => ({ facets: [], search: '', consents: [] });

const runOutRetries = () => vi.advanceTimersByTimeAsync(5_000);

session.connect({
  navigate: vi.fn(),
  currentUrl: () => new URL('http://localhost'),
  showAccessUnavailable,
});

beforeEach(() => {
  mockApi.request.mockReset();
  mockToaster.error.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setToken('token');
  user.set({ consents: {} });
});

describe('getConsents', () => {
  it('unwraps the consents map from the UserConsents entity', async () => {
    mockApi.request.mockResolvedValue({ uuid: 'abc', userId: '1234', consents });

    await expect(getConsents()).resolves.toEqual(consents);
    expect(mockApi.request).toHaveBeenCalledWith(Psama.User.Consents);
  });

  it('returns an empty map when the response has no consents key', async () => {
    mockApi.request.mockResolvedValue({ uuid: 'abc', userId: '1234' });

    await expect(getConsents()).resolves.toEqual({});
  });

  describe('retries', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('retries immediately, without waiting, on the first failure', async () => {
      mockApi.request
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValueOnce({ uuid: 'abc', consents });

      // No timer advance: the second attempt must not be behind a delay.
      await expect(getConsents()).resolves.toEqual(consents);
      expect(mockApi.request).toHaveBeenCalledTimes(2);
    });

    it('backs off before the third attempt', async () => {
      mockApi.request
        .mockRejectedValueOnce(new Error('500'))
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValueOnce({ uuid: 'abc', consents });

      const pending = getConsents();
      await vi.advanceTimersByTimeAsync(0);
      expect(mockApi.request).toHaveBeenCalledTimes(2);

      await runOutRetries();
      await expect(pending).resolves.toEqual(consents);
      expect(mockApi.request).toHaveBeenCalledTimes(3);
    });

    it('rejects after three attempts so callers can distinguish failure from no access', async () => {
      mockApi.request.mockRejectedValue(new Error('500'));

      const pending = getConsents();
      const assertion = expect(pending).rejects.toThrow('500');
      await runOutRetries();

      await assertion;
      expect(mockApi.request).toHaveBeenCalledTimes(3);
    });
  });
});

describe('loadConsents', () => {
  it('stores the consents and leaves access available', async () => {
    user.set({});
    mockApi.request.mockResolvedValue({ consents });

    await loadConsents();

    expect(get(user).consents).toEqual(consents);
    expect(get(accessUnavailable)).toBe(false);
    expect(mockToaster.error).not.toHaveBeenCalled();
  });

  it('leaves consents undefined and toasts once the attempts are exhausted', async () => {
    vi.useFakeTimers();
    mockApi.request.mockRejectedValue(new Error('500'));

    const pending = loadConsents();
    await runOutRetries();
    await pending;
    vi.useRealTimers();

    expect(get(user).consents).toBeUndefined();
    expect(get(accessUnavailable)).toBe(true);
    expect(mockToaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: ACCESS_UNAVAILABLE_MESSAGE }),
    );
  });

  it('ignores a superseded response that resolves after a later request settled', async () => {
    let resolveStale!: (value: unknown) => void;
    mockApi.request
      .mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve)))
      .mockResolvedValueOnce({ consents });

    const stale = loadConsents();
    const fresh = loadConsents();
    await fresh;

    resolveStale({ consents: { '\\_consents\\': ['prior-user-study'] } });
    await stale;

    expect(get(user).consents).toEqual(consents);
  });

  it('does not toast when a superseded request exhausts its retries', async () => {
    vi.useFakeTimers();
    mockApi.request
      .mockRejectedValueOnce(new Error('500'))
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValueOnce({ consents })
      .mockRejectedValueOnce(new Error('500'));

    const stale = loadConsents();
    // Flush the two immediate attempts so the stale request is parked in its back-off.
    await vi.advanceTimersByTimeAsync(0);
    const fresh = loadConsents();
    await fresh;
    await runOutRetries();
    await stale;
    vi.useRealTimers();

    expect(get(user).consents).toEqual(consents);
    expect(mockToaster.error).not.toHaveBeenCalled();
  });

  it('neither retries nor toasts after a 401, which has already logged the user out', async () => {
    mockApi.request.mockRejectedValue(new ApiError(401, 'unauthorized', 'expired', 'expired'));

    await loadConsents();

    expect(mockApi.request).toHaveBeenCalledOnce();
    expect(mockToaster.error).not.toHaveBeenCalled();
  });

  it('drops an in-flight response when the session is cleared', async () => {
    let resolveStale!: (value: unknown) => void;
    mockApi.request.mockImplementationOnce(
      () => new Promise((resolve) => (resolveStale = resolve)),
    );

    const stale = loadConsents();
    clearSession();
    resolveStale({ consents });
    await stale;

    expect(get(user).consents).toBeUndefined();
  });
});

describe('ensureConsentsLoaded', () => {
  it('returns stored consents without fetching them again', async () => {
    user.set({ consents });

    await expect(ensureConsentsLoaded()).resolves.toEqual(consents);
    expect(mockApi.request).not.toHaveBeenCalled();
  });

  it('fetches consents when they are not set', async () => {
    user.set({});
    mockApi.request.mockResolvedValue({ consents });

    await expect(ensureConsentsLoaded()).resolves.toEqual(consents);
    expect(mockApi.request).toHaveBeenCalledWith(Psama.User.Consents);
  });
});

describe('accessUnavailable', () => {
  it('distinguishes "loaded, no access" from "could not determine access"', () => {
    user.set({ consents: {} });
    expect(get(accessUnavailable)).toBe(false);

    user.set({ consents: undefined });
    expect(get(accessUnavailable)).toBe(true);
  });

  it('is false when logged out, where access is simply not applicable', () => {
    user.set({ consents: undefined });
    removeToken();

    expect(get(accessUnavailable)).toBe(false);
  });

  it('survives the sessionStorage round trip a page reload performs', () => {
    const restored = JSON.parse(JSON.stringify({ privileges: ['QUERY'], consents: undefined }));

    user.set(restored);

    expect('consents' in restored).toBe(false);
    expect(get(accessUnavailable)).toBe(true);
  });
});

describe('addConsents', () => {
  it('populates the request from the user store', async () => {
    user.set({ consents });

    await expect(addConsents(blankRequest())).resolves.toEqual({
      facets: [],
      search: '',
      consents: ['phs001', 'phs002'],
    });
  });

  it('sends an empty list when the user genuinely has no access', async () => {
    user.set({ consents: {} });

    await expect(addConsents(blankRequest())).resolves.toHaveProperty('consents', []);
  });

  it('sends an empty list when the token is gone but the user blob lingers', async () => {
    user.set({ consents });
    removeToken();

    await expect(addConsents(blankRequest())).resolves.toHaveProperty('consents', []);
  });

  it('throws and toasts rather than sending an empty list when access is unknown', async () => {
    user.set({ consents: undefined });

    await expect(addConsents(blankRequest())).rejects.toThrow(ACCESS_UNAVAILABLE_MESSAGE);
    expect(mockToaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: ACCESS_UNAVAILABLE_MESSAGE }),
    );
  });

  it('throws without toasting while the terms dialog asks the user to accept', async () => {
    user.set({ acceptedTOS: false });

    await expect(addConsents(blankRequest())).rejects.toThrow(ACCESS_UNAVAILABLE_MESSAGE);
    expect(mockToaster.error).not.toHaveBeenCalled();
  });

  it('stays closed after a reload, where no fetch is in flight to wait on', async () => {
    // Reload keeps privileges, so the layout skips re-hydrating and nothing is in flight.
    user.set(JSON.parse(JSON.stringify({ privileges: ['QUERY'], consents: undefined })));

    await expect(addConsents(blankRequest())).rejects.toThrow(ACCESS_UNAVAILABLE_MESSAGE);
  });
});
