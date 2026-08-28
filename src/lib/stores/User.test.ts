import { describe, it, expect, vi } from 'vitest';
import { isTokenExpired, getTokenExpiration, getTokenExpirationAsDate } from './User';

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
  ['string exp', '{"sub":"test","exp":"tomorrow"}'],
  ['null exp', '{"sub":"test","exp":null}'],
  ['positive overflow exp', '{"sub":"test","exp":1e309}'],
  ['negative overflow exp', '{"sub":"test","exp":-1e309}'],
] as const;

describe('isTokenExpired', () => {
  it('returns true for a token with a past expiration', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    expect(isTokenExpired(makeToken(pastExp))).toBe(true);
  });

  it('returns false for a token with a future expiration', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    expect(isTokenExpired(makeToken(futureExp))).toBe(false);
  });

  it('returns true for a malformed token', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });

  it.each(invalidExpirations)('returns true for %s', (_description, payload) => {
    expect(isTokenExpired(makeTokenWithPayload(payload))).toBe(true);
  });
});

describe('getTokenExpiration', () => {
  it('returns the expiration time in milliseconds', () => {
    const exp = 1700000000;
    expect(getTokenExpiration(makeToken(exp))).toBe(exp * 1000);
  });

  it('throws for an empty string', () => {
    expect(() => getTokenExpiration('')).toThrow('No token provided.');
  });

  it('throws for a token with invalid base64 payload', () => {
    expect(() => getTokenExpiration('a.!!!.c')).toThrow();
  });

  it.each(invalidExpirations)('throws for %s', (_description, payload) => {
    expect(() => getTokenExpiration(makeTokenWithPayload(payload))).toThrow(
      'Token expiration must be a finite number.',
    );
  });
});

describe('getTokenExpirationAsDate', () => {
  it('returns a Date object for a valid token', () => {
    const exp = 1700000000;
    const result = getTokenExpirationAsDate(makeToken(exp));
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(exp * 1000);
  });

  it('returns undefined for an invalid token', () => {
    expect(getTokenExpirationAsDate('bad')).toBeUndefined();
  });
});
