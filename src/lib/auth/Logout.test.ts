// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { goto } = vi.hoisted(() => ({ goto: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('$app/paths', () => ({
  resolve: (path: string) => (path.startsWith('/') ? path : `/${path}`),
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  getSessionId: () => 'session-id',
  registerSignedInUser: vi.fn(),
}));

import { clearSession, hydrateUserFromToken, logout } from '#lib/auth/User.ts';
import { request } from '#lib/api/client.ts';
import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';

// The PSAMA logout call goes through the real API client, whose 401 and 403 handling starts a
// logout of its own.
const psamaLogoutFailures = {
  'a network error': () => Promise.reject(new TypeError('Failed to fetch')),
  'a 401': () => Promise.resolve(new Response('expired', { status: 401 })),
  'a 403': () => Promise.resolve(new Response('forbidden', { status: 403 })),
};

describe('logout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('token', 'token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    goto.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('lets a second caller wait for the logout already running', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}'))),
    );

    await Promise.all([logout(), logout()]);

    expect(fetch).toHaveBeenCalledOnce();
    expect(goto).toHaveBeenCalledOnce();
  });

  describe('the Okta ID token', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response('{}'))),
      );
      localStorage.setItem('oktaIdToken', 'id-token');
    });

    it('stays until the provider has built its logout URL, then goes', async () => {
      let seenByProvider: string | null = null;
      const provider = {
        logout: vi.fn(async () => {
          seenByProvider = localStorage.getItem('oktaIdToken');
        }),
      };

      await logout(provider as unknown as AuthProvider);

      expect(seenByProvider).toBe('id-token');
      expect(localStorage.getItem('oktaIdToken')).toBeNull();
    });

    it('goes on a logout without a provider', async () => {
      await logout();

      expect(localStorage.getItem('oktaIdToken')).toBeNull();
    });

    it('goes when a guard clears the session', () => {
      clearSession();

      expect(localStorage.getItem('oktaIdToken')).toBeNull();
    });

    it('goes when the app starts with an expired session', async () => {
      localStorage.setItem('token', `${btoa('{}')}.${btoa(JSON.stringify({ exp: 1 }))}.sig`);

      vi.resetModules();
      await import('#lib/auth/User.ts');

      expect(localStorage.getItem('oktaIdToken')).toBeNull();
    });
  });

  describe.each(Object.entries(psamaLogoutFailures))(
    'when the PSAMA logout fails with %s',
    (_failure, respond) => {
      beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(respond));
      });

      it('navigates to login once without a provider', async () => {
        await logout();

        expect(fetch).toHaveBeenCalledOnce();
        expect(goto).toHaveBeenCalledOnce();
        expect(goto).toHaveBeenCalledWith('/login');
        expect(localStorage.getItem('token')).toBeNull();
      });

      it('navigates to login once when the provider logout fails too', async () => {
        const provider = { logout: vi.fn().mockRejectedValue(new Error('not implemented')) };

        await logout(provider as unknown as AuthProvider);

        expect(goto).toHaveBeenCalledOnce();
        expect(goto).toHaveBeenCalledWith('/login');
      });
    },
  );

  describe('when an API request reaches the session hooks', () => {
    function respondFirstWith(response: Response) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce(response).mockResolvedValue(new Response('{}')),
      );
    }

    it('sends the stored token', async () => {
      respondFirstWith(new Response('{}'));

      await request('picsure/query/sync');

      expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({
        Authorization: 'Bearer token',
      });
    });

    it('logs out to login with the timeout reason and the way back on a 401', async () => {
      respondFirstWith(new Response('expired', { status: 401 }));

      await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'unauthorized' });

      await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
      expect(goto).toHaveBeenCalledWith('/login?redirectTo=%2Fexplorer');
      expect(sessionStorage.getItem('logout-reason')).toBe(
        'Your session has timed out. Please log in.',
      );
    });

    it('leaves a 401 on the profile request to the logout, so hydration callers stay put', async () => {
      respondFirstWith(new Response('expired', { status: 401 }));

      await expect(hydrateUserFromToken()).resolves.toBeUndefined();

      await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
      expect(goto).toHaveBeenCalledWith('/login?redirectTo=%2Fexplorer');
    });

    it('logs out to login and drops any earlier reason on a 403', async () => {
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in.');
      respondFirstWith(new Response('forbidden', { status: 403 }));

      await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });

      await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
      expect(goto).toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem('logout-reason')).toBeNull();
    });

    it('stores a refreshed token', async () => {
      respondFirstWith(new Response('{}', { headers: { Authorization: 'Bearer fresh' } }));

      await request('picsure/query/sync');

      expect(localStorage.getItem('token')).toBe('fresh');
    });
  });
});
