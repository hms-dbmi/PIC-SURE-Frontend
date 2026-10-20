// @vitest-environment happy-dom

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const environment = vi.hoisted(() => ({ browser: true }));
vi.mock('$app/env', () => environment);

import { session } from '#lib/auth/session.svelte.ts';
import { getTokenExpiration, getTokenExpirationAsDate, isTokenExpired } from '#lib/auth/token.ts';

vi.mock('#lib/telemetry/logger.ts', () => ({
  createLog: vi.fn(),
  log: vi.fn(),
  registerSignedInUser: vi.fn(),
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

  it('reads a current token whose claims encode to base64url-only characters', () => {
    // '???' encodes to '_' in base64url, which plain base64 decoding rejects
    const payload = btoa(JSON.stringify({ sub: 'test', exp: 4102444800, name: '???' }))
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `${btoa('{}')}.${payload}.fake-signature`;
    expect(payload).toContain('_');

    expect(isTokenExpired(token)).toBe(false);
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

  it('throws when no token is provided', () => {
    expect(() => getTokenExpiration('')).toThrow('No token provided.');
  });

  it('returns the expiration as a Date, or undefined for an invalid token', () => {
    const exp = 1700000000;

    expect(getTokenExpirationAsDate(makeToken(exp))?.getTime()).toBe(exp * 1000);
    expect(getTokenExpirationAsDate('bad')).toBeUndefined();
  });
});

/** Reads `session.hasValidToken` from an effect, as a component would, until stopped. */
function observeValidity() {
  const seen = { valid: undefined as boolean | undefined, stop: () => {} };
  seen.stop = $effect.root(() => {
    $effect(() => {
      seen.valid = session.hasValidToken;
    });
  });
  flushSync();
  return seen;
}

describe('hasValidToken', () => {
  afterEach(() => {
    environment.browser = true;
    vi.restoreAllMocks();
    session.removeToken();
    vi.useRealTimers();
  });

  it('is false on the server, which never reads browser storage', async () => {
    session.setToken(makeToken(Math.floor(Date.now() / 1000) + 60));
    environment.browser = false;
    const readStorage = vi.spyOn(localStorage, 'getItem');
    vi.resetModules();
    const server = await import('#lib/auth/session.svelte.ts');

    expect(server.session.hasValidToken).toBe(false);
    expect(readStorage).not.toHaveBeenCalled();
  });

  it('is false when a stored token has expired', () => {
    vi.useFakeTimers();
    session.setToken(makeToken(Math.floor(Date.now() / 1000) - 1));
    const observed = observeValidity();

    expect(observed.valid).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.getItem('token')).not.toBeNull();
    observed.stop();
  });

  it.each(invalidExpirations)('rejects %s without scheduling a timer', (_description, payload) => {
    vi.useFakeTimers();
    session.setToken(makeTokenWithPayload(payload));
    const observed = observeValidity();

    expect(observed.valid).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    observed.stop();
  });

  it('reacts when a stored token reaches its expiration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    session.setToken(makeToken(Math.floor(Date.now() / 1000) + 2));
    const observed = observeValidity();
    expect(observed.valid).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(2_001);
    flushSync();

    expect(observed.valid).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.getItem('token')).not.toBeNull();
    observed.stop();
  });

  it('replaces the expiration timer when the token changes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
    session.setToken(makeToken(Math.floor(Date.now() / 1000) + 2));
    const observed = observeValidity();
    expect(observed.valid).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1_000);
    session.setToken(makeToken(Math.floor(Date.now() / 1000) + 10));
    flushSync();
    expect(observed.valid).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(2_000);
    flushSync();
    expect(observed.valid).toBe(true);
    observed.stop();
    flushSync();
    expect(vi.getTimerCount()).toBe(0);
  });
});
