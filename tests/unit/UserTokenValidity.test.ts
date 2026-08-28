// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasValidToken, removeToken, setToken } from '$lib/stores/User';

function makeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'test', exp }));
  return `${header}.${payload}.fake-signature`;
}

describe('hasValidToken', () => {
  afterEach(() => {
    removeToken();
    vi.useRealTimers();
  });

  it('is false when a stored token has expired', () => {
    setToken(makeToken(Math.floor(Date.now() / 1000) - 1));
    let valid = true;
    const unsubscribe = hasValidToken.subscribe((value) => (valid = value));

    expect(valid).toBe(false);
    expect(localStorage.getItem('token')).not.toBeNull();
    unsubscribe();
  });

  it('reacts when a stored token reaches its expiration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    setToken(makeToken(Math.floor(Date.now() / 1000) + 2));
    let valid = false;
    const unsubscribe = hasValidToken.subscribe((value) => (valid = value));
    expect(valid).toBe(true);

    vi.advanceTimersByTime(2_001);

    expect(valid).toBe(false);
    expect(localStorage.getItem('token')).not.toBeNull();
    unsubscribe();
  });
});
