import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '#lib/auth/model/user.ts';

const fakeSession = vi.hoisted(() => ({
  isLoggedIn: false,
  hasValidToken: false,
  user: {} as User,
  clear: vi.fn(),
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

const signedIn = { isLoggedIn: true, hasValidToken: true, user: { privileges: ['QUERY'] } };
const expired = { isLoggedIn: true, hasValidToken: false, user: { privileges: ['QUERY'] } };
const signedOut = { isLoggedIn: false, hasValidToken: false, user: {} };

function arrive(path: string, state: Partial<typeof fakeSession>) {
  Object.assign(fakeSession, state);
  handleAccessReason(new URL(path, 'http://localhost'));
  return {
    events: vi.mocked(log).mock.calls.map(([entry]) => entry),
    ended: fakeSession.clear.mock.calls.length > 0,
    toasts: vi.mocked(toaster.error).mock.calls.map(([toast]) => toast.title),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('handleAccessReason', () => {
  it('ends an expired session, logs it against the page asked for, and says so', () => {
    expect(arrive('/login?redirectTo=%2Fexplorer%3Fsearch%3Dage&reason=expired', expired)).toEqual({
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

  it('logs before ending the session, so the event still names the user', () => {
    fakeSession.clear.mockImplementationOnce(() => expect(log).toHaveBeenCalled());

    arrive('/login?redirectTo=%2Fdataset&reason=expired', expired);

    expect(fakeSession.clear).toHaveBeenCalled();
  });

  it('logs a visitor sent away from an authorized page without a token', () => {
    expect(arrive('/login?redirectTo=%2Fdataset&reason=no_token', signedOut)).toEqual({
      events: [
        { category: 'AUTH', event: 'auth.redirect_no_token', details: { targetUrl: '/dataset' } },
      ],
      ended: true,
      toasts: [],
    });
  });

  it('ends a session whose profile failed to load, without a toast', () => {
    const noProfile = { isLoggedIn: true, hasValidToken: true, user: {} };

    expect(arrive('/login?redirectTo=%2Fdataset&reason=hydrate_failed', noProfile)).toEqual({
      events: [],
      ended: true,
      toasts: [],
    });
  });

  it('tells a signed-out visitor that Explore needs a login', () => {
    expect(arrive('/login?redirectTo=%2Fexplorer&reason=explore', signedOut)).toEqual({
      events: [],
      ended: false,
      toasts: ['You must be logged in to access Explore.'],
    });
  });

  it('logs a signed-in user turned away for lacking query access', () => {
    expect(arrive('/?reason=no_privilege&from=%2Fdataset%3Fx%3D1', signedIn)).toEqual({
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

  // A reloaded, bookmarked or shared URL keeps its reason after the session moved on.
  it.each([
    ['expired', '/login?redirectTo=%2F&reason=expired', signedOut],
    ['expired', '/login?redirectTo=%2F&reason=expired', signedIn],
    ['no_token', '/login?redirectTo=%2F&reason=no_token', signedIn],
    ['hydrate_failed', '/login?redirectTo=%2F&reason=hydrate_failed', signedIn],
    ['explore', '/login?redirectTo=%2F&reason=explore', signedIn],
    ['no_privilege', '/?reason=no_privilege&from=%2Fdataset', signedOut],
  ])('ignores %s once it no longer applies (%s)', (_, path, state) => {
    expect(arrive(path, state)).toEqual({ events: [], ended: false, toasts: [] });
  });

  it.each(['/login?redirectTo=%2F', '/?reason=toString', '/?reason=unknown'])(
    'does nothing for %s',
    (path) => {
      expect(arrive(path, signedOut)).toEqual({ events: [], ended: false, toasts: [] });
    },
  );
});
