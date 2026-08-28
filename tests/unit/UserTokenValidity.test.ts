// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasValidToken, removeToken, setToken } from '$lib/stores/User';

vi.mock('$lib/logger', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
}));

function makeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'test', exp }));
  return `${header}.${payload}.fake-signature`;
}

function makeTokenWithPayload(payload: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${btoa(payload)}.fake-signature`;
}

const invalidExpirations = [
  ['missing exp', '{"sub":"test"}'],
  ['string exp', '{"sub":"test","exp":"NaN"}'],
  ['null exp', '{"sub":"test","exp":null}'],
  ['positive overflow exp', '{"sub":"test","exp":1e309}'],
  ['negative overflow exp', '{"sub":"test","exp":-1e309}'],
] as const;

describe('hasValidToken', () => {
  afterEach(() => {
    removeToken();
    vi.useRealTimers();
  });

  it('is false when a stored token has expired', () => {
    vi.useFakeTimers();
    setToken(makeToken(Math.floor(Date.now() / 1000) - 1));
    let valid = true;
    const unsubscribe = hasValidToken.subscribe((value) => (valid = value));

    expect(valid).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.getItem('token')).not.toBeNull();
    unsubscribe();
  });

  it.each(invalidExpirations)('rejects %s without scheduling a timer', (_description, payload) => {
    vi.useFakeTimers();
    setToken(makeTokenWithPayload(payload));
    let valid = true;
    const unsubscribe = hasValidToken.subscribe((value) => (valid = value));

    expect(valid).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    unsubscribe();
  });

  it('reacts when a stored token reaches its expiration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    setToken(makeToken(Math.floor(Date.now() / 1000) + 2));
    let valid = false;
    const unsubscribe = hasValidToken.subscribe((value) => (valid = value));
    expect(valid).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(2_001);

    expect(valid).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.getItem('token')).not.toBeNull();
    unsubscribe();
  });

  it('replaces the expiration timer when the token changes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    setToken(makeToken(Math.floor(Date.now() / 1000) + 2));
    let valid = false;
    const unsubscribe = hasValidToken.subscribe((value) => (valid = value));
    expect(valid).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1_000);
    setToken(makeToken(Math.floor(Date.now() / 1000) + 10));
    expect(valid).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(2_000);
    expect(valid).toBe(true);
    unsubscribe();
    expect(vi.getTimerCount()).toBe(0);
  });
});
