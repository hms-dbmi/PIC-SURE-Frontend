// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginStateError, newLoginState, verifyLoginState } from '#lib/auth/loginState.ts';

function verdict(received: string | undefined) {
  try {
    verifyLoginState(received);
    return 'accepted';
  } catch (error) {
    if (error instanceof LoginStateError) return error.problem;
    throw error;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});

describe('newLoginState', () => {
  it('draws 256 random bits from the platform for every login', () => {
    const random = vi.spyOn(crypto, 'getRandomValues');

    const first = newLoginState();
    const second = newLoginState();

    expect(random).toHaveBeenCalledTimes(2);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).not.toBe(first);
  });

  it('drops the state Okta and RAS used to keep for every login', () => {
    localStorage.setItem('oauthState', 'okta-abc');
    localStorage.setItem('state', 'ras-abc');

    newLoginState();

    expect(localStorage.getItem('oauthState')).toBeNull();
    expect(localStorage.getItem('state')).toBeNull();
  });
});

describe('verifyLoginState', () => {
  it('accepts the state of the login this tab started, once', () => {
    const state = newLoginState();

    expect(verdict(state)).toBe('accepted');
    expect(verdict(state)).toBe('missing');
  });

  it('refuses any other state, and the login it refused is over', () => {
    const state = newLoginState();
    const other = state.slice(0, -1) + (state.endsWith('0') ? '1' : '0');

    expect(verdict(other)).toBe('mismatch');
    expect(verdict(state)).toBe('missing');
  });

  it.each([
    ['no state', () => undefined],
    ['an empty state', () => ''],
    ['the state plus more', (state: string) => state + '0'],
  ])('refuses a callback with %s', (_, received) => {
    const state = newLoginState();

    expect(verdict(received(state))).toBe('mismatch');
  });

  it('reports a tab that started no login as missing', () => {
    expect(verdict('a3f0')).toBe('missing');
  });
});
