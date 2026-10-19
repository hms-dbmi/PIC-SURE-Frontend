// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  getSessionId: () => 'session-id',
  registerSignedInUser: vi.fn(),
}));

import { logout, setToken } from '#lib/auth/User.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { request } from '#lib/api/client.ts';
import { createLog } from '#lib/telemetry/logger.ts';
import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
import AUTH0 from '#lib/auth/providers/AUTH0.ts';
import FENCE from '#lib/auth/providers/FENCE.ts';

const navigate = vi.fn();
session.connect({
  navigate,
  currentUrl: () => new URL('http://localhost/explorer'),
  showAccessUnavailable: vi.fn(),
});

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
    setToken('token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    navigate.mockReset();
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
    expect(navigate).toHaveBeenCalledOnce();
  });

  it("ends the session when the provider's logout throws instead of rejecting", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}'))),
    );
    const provider = {
      logout: () => {
        throw new URIError('URI malformed');
      },
    };

    await logout(provider as unknown as AuthProvider);

    expect(navigate).toHaveBeenCalledExactlyOnceWith('/login');
  });

  const common = { description: 'Log in', enabled: true, alt: false };
  describe.each([
    [
      'AUTH0',
      () => new AUTH0({ ...common, name: 'AUTH0', type: 'AUTH0', clientid: 'c', connection: 'x' }),
    ],
    [
      'FENCE',
      () =>
        new FENCE({ ...common, name: 'FENCE', type: 'FENCE', uri: 'u', clientid: 'c', idp: 'i' }),
    ],
  ])('through %s, which leaves its IdP session alone', (_, create) => {
    it('ends the session once, without an error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response('{}'))),
      );
      vi.mocked(createLog).mockClear();

      await logout(create());

      expect(navigate).toHaveBeenCalledExactlyOnceWith('/login');
      expect(localStorage.getItem('token')).toBeNull();
      expect(console.error).not.toHaveBeenCalled();
      const loggedOut = vi
        .mocked(createLog)
        .mock.calls.filter((call) => call[1] === 'logout.success');
      expect(loggedOut).toHaveLength(1);
    });
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

    it('goes when the session is cleared', () => {
      session.clear();

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
        expect(navigate).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith('/login');
        expect(localStorage.getItem('token')).toBeNull();
      });

      it('navigates to login once when the provider logout fails too', async () => {
        const provider = { logout: vi.fn().mockRejectedValue(new Error('not implemented')) };

        await logout(provider as unknown as AuthProvider);

        expect(navigate).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith('/login');
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

      await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
      expect(navigate).toHaveBeenCalledWith('/login?redirectTo=%2Fexplorer');
      expect(sessionStorage.getItem('logout-reason')).toBe(
        'Your session has timed out. Please log in.',
      );
    });

    it('leaves a 401 on the profile request to the logout, so hydration callers stay put', async () => {
      respondFirstWith(new Response('expired', { status: 401 }));

      await expect(session.hydrate()).resolves.toBeUndefined();

      await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
      expect(navigate).toHaveBeenCalledWith('/login?redirectTo=%2Fexplorer');
    });

    it('logs out to login and drops any earlier reason on a 403', async () => {
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in.');
      respondFirstWith(new Response('forbidden', { status: 403 }));

      await expect(request('picsure/query/sync')).rejects.toMatchObject({ code: 'forbidden' });

      await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
      expect(navigate).toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem('logout-reason')).toBeNull();
    });

    it('stores a refreshed token', async () => {
      respondFirstWith(new Response('{}', { headers: { Authorization: 'Bearer fresh' } }));

      await request('picsure/query/sync');

      expect(localStorage.getItem('token')).toBe('fresh');
    });

    it('keeps a refreshed token when reloading the user after it fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce(new Response('{}', { headers: { Authorization: 'Bearer fresh' } }))
          .mockResolvedValue(new Response('unavailable', { status: 503 })),
      );

      await request('picsure/query/sync');

      await vi.waitFor(() =>
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('token refresh')),
      );
      expect(localStorage.getItem('token')).toBe('fresh');
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
