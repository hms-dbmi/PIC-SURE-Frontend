import { flushSync } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  registerSignedInUser: vi.fn(),
}));

import {
  getToken,
  isUserLoggedIn,
  removeToken,
  setToken,
  tokenStatus,
  user,
} from '#lib/auth/User.ts';
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

  it('leave an effect that reads them with get() independent of the session, as stores did', () => {
    let runs = 0;
    const stop = $effect.root(() => {
      $effect(() => {
        runs++;
        get(user);
        get(tokenStatus);
        isUserLoggedIn();
        getToken();
      });
    });
    flushSync();

    setToken('token');
    user.set({ email: 'changed@example.org' });
    flushSync();

    expect(runs).toBe(1);
    stop();
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
});
