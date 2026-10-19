import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakeSession = vi.hoisted(() => ({
  isLoggedIn: false,
  hasValidToken: false,
  profileFailed: false,
  privileges: [] as string[],
  clear: vi.fn(),
  bootstrap: vi.fn(() => Promise.resolve()),
}));

vi.mock('#lib/auth/session.svelte.ts', () => ({ session: fakeSession }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn((category: string, event: string, details: object) => ({
    category,
    event,
    details,
  })),
}));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { error: vi.fn() } }));

import { handleAccessReason } from '#lib/auth/accessReason.ts';
import { log } from '#lib/telemetry/logger.ts';
import { toaster } from '#lib/ui/toaster.ts';

const QUERY = ['PIC_SURE_ANY_QUERY'];
const signedIn = { isLoggedIn: true, hasValidToken: true, profileFailed: false, privileges: QUERY };
const expired = { ...signedIn, hasValidToken: false };
const signedOut = { isLoggedIn: false, hasValidToken: false, profileFailed: false, privileges: [] };
const withoutQuery = { ...signedIn, privileges: ['MANAGED_PRIV_OPEN_ACCESS'] };

async function arrive(path: string, state: Partial<typeof fakeSession>) {
  Object.assign(fakeSession, state);
  await handleAccessReason(new URL(path, 'http://localhost'));
  return {
    events: vi.mocked(log).mock.calls.map(([entry]) => entry),
    ended: fakeSession.clear.mock.calls.length > 0,
    toasts: vi.mocked(toaster.error).mock.calls.map(([toast]) => toast.title),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('handleAccessReason', () => {
  it('ends an expired session, logs it against the page asked for, and says so', async () => {
    expect(
      await arrive('/login?redirectTo=%2Fexplorer%3Fsearch%3Dage&reason=expired', expired),
    ).toEqual({
      events: [
        {
          category: 'AUTH',
          event: 'auth.redirect_token_expired',
          details: { targetUrl: '/explorer' },
        },
      ],
      ended: true,
      toasts: ['Your session has timed out. Please log in again.'],
    });
  });

  it('logs before ending the session, so the event still names the user', async () => {
    fakeSession.clear.mockImplementationOnce(() => expect(log).toHaveBeenCalled());

    await arrive('/login?redirectTo=%2Fdataset&reason=expired', expired);

    expect(fakeSession.clear).toHaveBeenCalled();
  });

  it('logs a visitor sent away from an authorized page without a token', async () => {
    expect(await arrive('/login?redirectTo=%2Fdataset&reason=no_token', signedOut)).toEqual({
      events: [
        { category: 'AUTH', event: 'auth.redirect_no_token', details: { targetUrl: '/dataset' } },
      ],
      ended: true,
      toasts: [],
    });
  });

  it('ends a session whose profile failed to load, without a toast', async () => {
    const failed = { ...signedIn, profileFailed: true, privileges: [] };

    expect(await arrive('/login?redirectTo=%2Fdataset&reason=hydrate_failed', failed)).toEqual({
      events: [],
      ended: true,
      toasts: [],
    });
  });

  it('tells a signed-out visitor that Explore needs a login', async () => {
    expect(await arrive('/login?redirectTo=%2Fexplorer&reason=explore', signedOut)).toEqual({
      events: [],
      ended: false,
      toasts: ['You must be logged in to access Explore.'],
    });
  });

  it('logs a signed-in user turned away for lacking query access', async () => {
    expect(await arrive('/?reason=no_privilege&from=%2Fdataset%3Fx%3D1', withoutQuery)).toEqual({
      events: [
        {
          category: 'AUTH',
          event: 'auth.redirect_no_privilege',
          details: { targetUrl: '/dataset', missingPrivilege: 'QUERY' },
        },
      ],
      ended: false,
      toasts: [],
    });
  });

  it('tells a visitor whose login callback found no login in the tab to log in again', async () => {
    expect(await arrive('/login?redirectTo=%2Fexplorer&reason=login_restart', signedOut)).toEqual({
      events: [],
      ended: false,
      toasts: ['Your login could not be completed. Please log in again.'],
    });
  });

  it('waits for a fresh tab to load the profile before deciding a denial applies', async () => {
    fakeSession.bootstrap.mockImplementationOnce(async () => {
      fakeSession.privileges = QUERY;
    });

    expect(
      await arrive('/?reason=no_privilege&from=%2Fadmin%2Fusers', { ...signedIn, privileges: [] }),
    ).toEqual({ events: [], ended: false, toasts: [] });
  });

  // A reloaded, bookmarked or linked URL can carry a reason that doesn't describe the session.
  it.each([
    ['expired', '/login?redirectTo=%2F&reason=expired', signedOut],
    ['expired', '/login?redirectTo=%2F&reason=expired', signedIn],
    ['no_token', '/login?redirectTo=%2F&reason=no_token', signedIn],
    ['hydrate_failed', '/login?redirectTo=%2F&reason=hydrate_failed', signedIn],
    // A fresh tab whose profile is still loading.
    [
      'hydrate_failed',
      '/login?redirectTo=%2F&reason=hydrate_failed',
      { ...signedIn, privileges: [] },
    ],
    ['no_privilege', '/?reason=no_privilege&from=%2Fadmin%2Fusers', signedIn],
    ['explore', '/login?redirectTo=%2F&reason=explore', signedIn],
    ['login_restart', '/login?redirectTo=%2F&reason=login_restart', signedIn],
    ['no_privilege', '/?reason=no_privilege&from=%2Fdataset', signedOut],
  ])('ignores %s once it no longer applies (%s)', async (_, path, state) => {
    expect(await arrive(path, state)).toEqual({ events: [], ended: false, toasts: [] });
  });

  it.each(['/login?redirectTo=%2F', '/?reason=toString', '/?reason=unknown'])(
    'does nothing for %s',
    async (path) => {
      expect(await arrive(path, signedOut)).toEqual({ events: [], ended: false, toasts: [] });
    },
  );
});
