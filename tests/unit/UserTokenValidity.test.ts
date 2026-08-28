// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getTokenExpiration,
  hasValidToken,
  isTokenExpired,
  removeToken,
  setToken,
} from '$lib/stores/User';

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

describe('token expiration helpers', () => {
  afterEach(() => vi.useRealTimers());

  it('returns a finite future expiration in milliseconds and reports the token as current', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    const expirationSeconds = Math.floor(Date.now() / 1000) + 60;
    const token = makeToken(expirationSeconds);

    expect(getTokenExpiration(token)).toBe(expirationSeconds * 1000);
    expect(isTokenExpired(token)).toBe(false);
  });

  it('reports a token with a finite past expiration as expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));

    expect(isTokenExpired(makeToken(Math.floor(Date.now() / 1000) - 1))).toBe(true);
  });

  it('fails closed for a malformed token', () => {
    expect(() => getTokenExpiration('not-a-jwt')).toThrow('Error parsing token:');
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });

  it.each(invalidExpirations)('fails closed for %s', (_description, payload) => {
    const token = makeTokenWithPayload(payload);

    expect(() => getTokenExpiration(token)).toThrow('Token expiration must be a finite number.');
    expect(isTokenExpired(token)).toBe(true);
  });
});

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
