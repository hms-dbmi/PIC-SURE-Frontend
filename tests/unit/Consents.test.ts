// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

const mockApi = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), isAbortError: () => false }));
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/api', () => mockApi);
vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  registerAssociatedStudies: vi.fn(),
}));
vi.mock('$lib/stores/Search', () => ({ searchTerm: {}, selectedFacets: {} }));
vi.mock('$lib/utilities/QueryBuilder', () => ({
  getQueryRequestV3: vi.fn(),
  getBlankQueryRequestV3: vi.fn(),
}));

import {
  access,
  ensureAccess,
  AccessUnavailableError,
  SessionChangedError,
} from '$lib/state/access.svelte';
import { session, setToken, removeToken, getToken, renewToken } from '$lib/state/session.svelte';
import { user, hydrateUserFromToken, clearSession } from '$lib/stores/User';
import { addConsents } from '$lib/stores/Dictionary';
import { landingStats, loadLandingStats, retryLandingStats } from '$lib/state/landingStats.svelte';
import { config } from '$lib/configuration.svelte';
import { Psama } from '$lib/paths';

const consents = { '\\_consents\\': ['phs001', 'phs002'] };
const blankRequest = () => ({ facets: [], search: '' });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  removeToken();
  setToken('session-a');
  mockApi.get.mockReset().mockResolvedValue({ consents });
  mockApi.post
    .mockReset()
    .mockImplementation(async (path: string) =>
      path.includes('concepts')
        ? { totalElements: 23 }
        : [{ name: 'dataset_id', facets: [{ count: 23 }] }],
    );
  config.features.login.open = true;
  config.branding.landing.stats = [
    { key: 'dict:concepts', label: 'Variables' },
    { key: 'dict:facets:dataset_id', label: 'Data sources' },
  ];
});
afterEach(() => {
  vi.useRealTimers();
});

describe('access lifecycle', () => {
  it('loads once for concurrent consumers in a fresh tab', async () => {
    const response = deferred<{ consents: typeof consents }>();
    mockApi.get.mockReturnValue(response.promise);
    expect(access.state.status).toBe('idle');
    const first = ensureAccess();
    const second = ensureAccess();
    expect(first).toBe(second);
    expect(access.state.status).toBe('loading');
    await Promise.resolve();
    expect(mockApi.get).toHaveBeenCalledOnce();
    response.resolve({ consents });
    await expect(first).resolves.toEqual(consents);
    expect(access.state.status).toBe('ready');
    await ensureAccess();
    expect(mockApi.get).toHaveBeenCalledOnce();
    expect(get(user).consents).toBeUndefined();
  });

  it('permits a successful empty consent map', async () => {
    mockApi.get.mockResolvedValue({ consents: {} });
    await expect(addConsents(blankRequest())).resolves.toHaveProperty('consents', []);
    expect(access.state.status).toBe('ready');
  });

  it('does not fetch consents for a public session', async () => {
    removeToken();
    await expect(addConsents(blankRequest())).resolves.toHaveProperty('consents', []);
    expect(mockApi.get).not.toHaveBeenCalled();
    expect(access.state.status).toBe('idle');
  });

  it('retries once immediately, then waits before the final attempt', async () => {
    vi.useFakeTimers();
    mockApi.get
      .mockRejectedValueOnce(new Error('500'))
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValue({ consents });
    const request = ensureAccess();
    await vi.advanceTimersByTimeAsync(0);
    expect(mockApi.get).toHaveBeenCalledTimes(2);
    expect(access.state.status).toBe('loading');
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(request).resolves.toEqual(consents);
    expect(mockApi.get).toHaveBeenCalledTimes(3);
  });

  it('keeps failure distinct from empty access and shares an explicit retry', async () => {
    vi.useFakeTimers();
    mockApi.get.mockRejectedValue(new Error('500'));
    const failure = expect(ensureAccess()).rejects.toBeInstanceOf(AccessUnavailableError);
    await vi.runAllTimersAsync();
    await failure;
    expect(access.state.status).toBe('error');
    await expect(ensureAccess()).rejects.toBeInstanceOf(AccessUnavailableError);
    expect(mockApi.get).toHaveBeenCalledTimes(3);
    mockApi.get.mockResolvedValue({ consents });
    const retry = ensureAccess({ retry: true });
    expect(ensureAccess({ retry: true })).toBe(retry);
    await retry;
    expect(access.state.status).toBe('ready');
    expect(mockApi.get).toHaveBeenCalledTimes(4);
  });

  it.each([undefined, {}, { consents: [] }, { consents: { study: 'invalid' } }])(
    'rejects malformed response %j',
    async (response) => {
      vi.useFakeTimers();
      mockApi.get.mockResolvedValue(response);
      const failure = expect(addConsents(blankRequest())).rejects.toBeInstanceOf(
        AccessUnavailableError,
      );
      await vi.runAllTimersAsync();
      await failure;
      expect(access.consents).toBeUndefined();
    },
  );

  it('discards a response from a previous session without disturbing the new request', async () => {
    const stale = deferred<{ consents: typeof consents }>();
    mockApi.get.mockReturnValueOnce(stale.promise);
    const oldRequest = ensureAccess();
    const rejected = expect(oldRequest).rejects.toBeInstanceOf(SessionChangedError);
    await Promise.resolve();
    setToken('session-b');
    const current = ensureAccess();
    await current;
    stale.resolve({ consents: { '\\_consents\\': ['old-study'] } });
    await rejected;
    expect(access.consents).toEqual(consents);
  });

  it('stops retries after logout during the backoff', async () => {
    vi.useFakeTimers();
    mockApi.get.mockRejectedValue(new Error('500'));
    const rejected = expect(ensureAccess()).rejects.toBeInstanceOf(SessionChangedError);
    await vi.advanceTimersByTimeAsync(0);
    clearSession();
    await vi.runAllTimersAsync();
    await rejected;
    expect(mockApi.get).toHaveBeenCalledTimes(2);
    expect(access.state.status).toBe('idle');
  });

  it('clears access and profile on logout in another tab', async () => {
    await ensureAccess();
    user.set({ privileges: ['ADMIN'] });
    localStorage.removeItem('token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: null }));
    expect(access.state.status).toBe('idle');
    expect(get(user)).toEqual({});
    expect(session.authenticated).toBe(false);
  });

  it('renews tokens without restarting access, and ignores a late old-session renewal', async () => {
    await ensureAccess();
    const revision = session.revision;
    renewToken('renewed-a', 'session-a');
    expect(session.revision).toBe(revision);
    expect(getToken()).toBe('renewed-a');
    expect(access.state.status).toBe('ready');
    setToken('session-b');
    renewToken('late-a', 'renewed-a');
    expect(getToken()).toBe('session-b');
    expect(access.state.status).toBe('idle');
  });

  it('does not let a failed profile request clear a replacement session', async () => {
    let rejectOld!: (error: Error) => void;
    mockApi.get.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectOld = reject;
        }),
    );
    const old = hydrateUserFromToken();
    setToken('session-b');
    mockApi.get.mockImplementation(async (path: string) =>
      path === Psama.User.Me
        ? { privileges: ['QUERY'], email: 'current@example.test' }
        : { consents },
    );
    await hydrateUserFromToken();
    rejectOld(new Error('old session failed'));
    await old;
    expect(getToken()).toBe('session-b');
    expect(get(user).email).toBe('current@example.test');
    expect(access.state.status).toBe('ready');
  });

  it('rejects dictionary construction if the session changes while reading cached access', async () => {
    await ensureAccess();
    const request = addConsents(blankRequest());
    removeToken();
    await expect(request).rejects.toBeInstanceOf(SessionChangedError);
  });

  it('hydrates profile and access once for concurrent session restoration', async () => {
    mockApi.get.mockImplementation(async (path: string) =>
      path === Psama.User.Me
        ? { privileges: ['QUERY'], consents: { '\\_consents\\': ['stale'] } }
        : { consents },
    );
    await Promise.all([hydrateUserFromToken(), hydrateUserFromToken()]);
    expect(mockApi.get).toHaveBeenCalledTimes(2);
    expect(get(user).privileges).toEqual(['QUERY']);
    expect(get(user).consents).toBeUndefined();
    expect(JSON.parse(sessionStorage.getItem('user')!).consents).toBeUndefined();
    expect(access.consents).toEqual(consents);
  });
});

describe('landing stats with real dictionary requests', () => {
  it('loads authenticated and public stats in a fresh tab using one consent request', async () => {
    await loadLandingStats();
    expect(mockApi.get).toHaveBeenCalledOnce();
    expect(mockApi.post).toHaveBeenCalledTimes(4);
    expect(landingStats.hasError).toBe(false);
    expect(landingStats.authStats).toHaveLength(2);
    const authRequests = mockApi.post.mock.calls.filter((call) => call[3] === true);
    expect(authRequests.map((call) => call[1].consents)).toEqual([
      consents['\\_consents\\'],
      consents['\\_consents\\'],
    ]);
  });

  it('recovers failed statistics after retrying access', async () => {
    vi.useFakeTimers();
    mockApi.get.mockRejectedValue(new Error('500'));
    const initial = loadLandingStats();
    await vi.runAllTimersAsync();
    await initial;
    expect(landingStats.hasError).toBe(true);
    expect(mockApi.post.mock.calls.every((call) => call[3] === false)).toBe(true);
    mockApi.get.mockResolvedValue({ consents });
    await retryLandingStats();
    expect(landingStats.hasError).toBe(false);
    expect(landingStats.loaded).toBe(true);
    expect(mockApi.post.mock.calls.filter((call) => call[3] === true)).toHaveLength(2);
  });

  it('retries a failed stats endpoint without refetching successful access', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('500'));
    await loadLandingStats();
    expect(landingStats.hasError).toBe(true);
    await loadLandingStats();
    expect(landingStats.hasError).toBe(false);
    expect(mockApi.get).toHaveBeenCalledOnce();
  });

  it('does not commit old stats after the session changes', async () => {
    const oldResponses = deferred<void>();
    const newResponses = deferred<void>();
    const response = (path: string) =>
      path.includes('concepts')
        ? { totalElements: 23 }
        : [{ name: 'dataset_id', facets: [{ count: 23 }] }];
    await ensureAccess();
    mockApi.post.mockImplementation(async (path: string) => {
      await oldResponses.promise;
      return response(path);
    });
    const old = loadLandingStats();
    await vi.waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(4));
    removeToken();
    mockApi.post.mockImplementation(async (path: string) => {
      await newResponses.promise;
      return response(path);
    });
    const current = loadLandingStats();
    await vi.waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(6));
    oldResponses.resolve();
    await old;
    expect(landingStats.loaded).toBe(false);
    expect(landingStats.authStats).toEqual([]);
    newResponses.resolve();
    await current;
    expect(landingStats.loaded).toBe(true);
    expect(landingStats.hasError).toBe(false);
  });

  it('shares pending stats, caches success, and invalidates on session replacement', async () => {
    const first = loadLandingStats();
    expect(loadLandingStats()).toBe(first);
    await first;
    await loadLandingStats();
    expect(mockApi.post).toHaveBeenCalledTimes(4);
    setToken('session-b');
    expect(landingStats.authStats).toEqual([]);
    await loadLandingStats();
    expect(mockApi.get).toHaveBeenCalledTimes(2);
    expect(mockApi.post).toHaveBeenCalledTimes(8);
  });
});
