// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mockApi = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { explorer: { open: false }, login: { open: false } } },
  routes: [],
}));
vi.mock('$lib/api', () => mockApi);
vi.mock('$lib/toaster', () => ({ toaster: { error: vi.fn() }, isToastShowing: () => false }));
vi.mock('$lib/logger', () => ({ createLog: vi.fn(), log: vi.fn() }));

import { consentsSettled, getToken, renewToken, setToken, user } from '$lib/stores/User';
import { Psama } from '$lib/paths';

function makeToken(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ iss: 'psama', exp: 4_102_444_800, ...claims }));
  return `${header}.${payload}.fake-signature`;
}

const alice = makeToken({ sub: 'alice', sid: 'session-1' });
const aliceRenewed = makeToken({ sub: 'alice', sid: 'session-1', exp: 4_102_444_900 });
const aliceNewSession = makeToken({ sub: 'alice', sid: 'session-2' });
const bob = makeToken({ sub: 'bob', sid: 'session-3' });

const aliceProfile = { email: 'alice@example.com', privileges: ['QUERY'] };
const aliceConsents = { '\\_consents\\': ['phs001'] };

/** What a browser does in this tab when another tab writes the token. */
function tokenChangedInAnotherTab(newValue: string | null) {
  const oldValue = localStorage.getItem('token');
  if (newValue) localStorage.setItem('token', newValue);
  else localStorage.removeItem('token');
  window.dispatchEvent(new StorageEvent('storage', { key: 'token', oldValue, newValue }));
}

beforeEach(() => {
  mockApi.get.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setToken(alice);
  user.set({ ...aliceProfile, consents: aliceConsents });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('renewToken', () => {
  it('stores the renewed token without reloading the profile or consents', () => {
    renewToken(aliceRenewed, alice);

    expect(getToken()).toBe(aliceRenewed);
    expect(get(user)).toEqual({ ...aliceProfile, consents: aliceConsents });
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('ignores a renewal for a session this tab has since replaced', () => {
    setToken(bob);

    renewToken(aliceRenewed, alice);

    expect(getToken()).toBe(bob);
  });

  it('ignores a renewal that arrives after logout', () => {
    localStorage.removeItem('token');

    renewToken(aliceRenewed, alice);

    expect(getToken()).toBe('');
  });

  it('ignores a renewal for a request sent without a token', () => {
    renewToken(aliceRenewed, '');

    expect(getToken()).toBe(alice);
  });
});

describe('token changes in another tab', () => {
  it('keeps the profile and consents when the other tab renews the same session', () => {
    tokenChangedInAnotherTab(aliceRenewed);

    expect(get(user)).toEqual({ ...aliceProfile, consents: aliceConsents });
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it.each([
    ['a different user', bob, { email: 'bob@example.com', privileges: ['QUERY'] }],
    ['a new session for the same user', aliceNewSession, aliceProfile],
  ])('reloads the profile and consents for %s', async (_description, token, profile) => {
    const consents = { '\\_consents\\': ['phs002'] };
    mockApi.get.mockImplementation(async (path: string) =>
      path === Psama.User.Consents ? { consents } : profile,
    );

    tokenChangedInAnotherTab(token);
    expect(get(user).consents).toBeUndefined();
    expect(get(user).privileges).toBeUndefined();

    await vi.waitFor(() => expect(mockApi.get).toHaveBeenCalledWith(Psama.User.Consents));
    await consentsSettled();
    expect(get(user)).toEqual({ ...profile, consents });
  });

  it('clears the profile and consents when the other tab logs out', () => {
    tokenChangedInAnotherTab(null);

    expect(get(user)).toEqual({});
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('ignores changes to other storage keys', () => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'filters', newValue: '[]' }));

    expect(get(user)).toEqual({ ...aliceProfile, consents: aliceConsents });
  });
});
