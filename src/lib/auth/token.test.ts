import { describe, expect, it } from 'vitest';

import { decodeJwtPayload } from '#lib/auth/token.ts';

// Encodes the way token issuers do: UTF-8 JSON, base64url alphabet, padding stripped.
function base64url(claims: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(claims));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const tokenWith = (claims: object) => `${base64url({ alg: 'HS256' })}.${base64url(claims)}.sig`;

describe('decodeJwtPayload', () => {
  it.each([
    ['-', { sub: 'u', exp: 4102444800, name: '~~~' }],
    ['_', { sub: 'u', exp: 4102444800, name: '???' }],
  ])('decodes a payload whose encoding contains %s', (char, claims) => {
    const token = tokenWith(claims);
    expect(token.split('.')[1]).toContain(char);

    expect(decodeJwtPayload(token)).toEqual(claims);
  });

  it('decodes a payload without padding', () => {
    const claims = { sub: 'u', exp: 4102444800 };
    const payload = base64url(claims);
    expect(payload.length % 4).not.toBe(0);

    expect(decodeJwtPayload(`header.${payload}.sig`)).toEqual(claims);
  });

  it('decodes non-ASCII claims as UTF-8', () => {
    const claims = { sub: 'u', exp: 4102444800, name: 'José Müller' };

    expect(decodeJwtPayload(tokenWith(claims))).toEqual(claims);
  });

  it.each([
    ['no payload', 'header'],
    ['an empty payload', 'header..sig'],
    ['a payload that is not base64url', 'header.@@@.sig'],
    ['a payload that is not JSON', `header.${btoa('not json')}.sig`],
  ])('throws for %s', (_case, token) => {
    expect(() => decodeJwtPayload(token)).toThrow();
  });
});
