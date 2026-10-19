import { flushSync } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  registerSignedInUser: vi.fn(),
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { dashboard: false, discover: false, login: { open: false } } },
}));

import { removeToken, setToken, tokenStatus, user, userRoutes } from '#lib/auth/User.ts';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';
import { session } from '#lib/auth/session.svelte.ts';

afterEach(() => {
  removeToken();
  user.set({});
  flushSync();
});

describe('the stores bridged from the session', () => {
  it('follow the session once Svelte flushes', () => {
    const seen: boolean[] = [];
    const unsubscribe = tokenStatus.subscribe((value) => seen.push(value));

    session.setToken('token');
    flushSync();
    session.removeToken();
    flushSync();

    expect(seen).toEqual([false, true, false]);
    unsubscribe();
  });

  it('give a new subscriber the current value after the session went back to its first', () => {
    const unsubscribe = tokenStatus.subscribe(() => {});
    setToken('token');
    flushSync();
    unsubscribe();
    removeToken();

    expect(get(tokenStatus)).toBe(false);
  });

  it('read a write that subscribers have not been told about yet', () => {
    const unsubscribe = user.subscribe(() => {});

    session.user = { email: 'new@example.org' };

    expect(get(user)).toEqual({ email: 'new@example.org' });
    unsubscribe();
  });

  it('write the session through the writable user store', () => {
    user.set({ email: 'set@example.org', token: 'long-term' });
    user.update((current) => ({ ...current, privileges: ['QUERY'] }));

    expect(session.user).toEqual({
      email: 'set@example.org',
      token: 'long-term',
      privileges: ['QUERY'],
    });
    expect(JSON.parse(sessionStorage.getItem('user') ?? '')).toEqual({
      email: 'set@example.org',
      privileges: ['QUERY'],
    });
  });

  it('recompute the routes when the user signs out, not only when the profile changes', () => {
    user.set({ privileges: [PicsurePrivileges.QUERY] });
    setToken('token');
    const paths: string[][] = [];
    const unsubscribe = userRoutes.subscribe((routes) => paths.push(routes.map((r) => r.path)));

    removeToken();
    flushSync();

    expect(paths).toEqual([['/explorer', '/help'], ['/help']]);
    unsubscribe();
  });
});
