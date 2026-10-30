import { describe, expect, it } from 'vitest';
import type { User } from '#lib/auth/model/user.ts';
import { routesFor, showsLink } from '#lib/auth/nav.ts';
import type { Features } from '#lib/config/index.ts';

function features(overrides: Record<string, unknown> = {}): Features {
  return {
    login: { open: true },
    explorer: { open: false },
    discover: false,
    analyzeApi: true,
    dashboard: true,
    ...overrides,
  } as unknown as Features;
}

const signedIn = (...privileges: string[]): User => ({ privileges });
const PUBLIC = ['/dashboard', '/api', '/help'];

describe('routesFor', () => {
  it.each<[string, User | undefined, Record<string, unknown>, string[]]>([
    ['signed out', undefined, {}, ['/explorer', '/dashboard', '/api', '/help']],
    [
      'signed out, with Discover',
      undefined,
      { discover: true },
      ['/dashboard', '/discover', '/api', '/help'],
    ],
    ['signed out, on a closed deployment', undefined, { login: { open: false } }, []],
    ['signed in, before the profile loads', {}, {}, PUBLIC],
    [
      'query access',
      signedIn('PIC_SURE_ANY_QUERY'),
      {},
      ['/dashboard', '/explorer', '/api', '/help'],
    ],
    [
      'query access and named datasets',
      signedIn('PIC_SURE_ANY_QUERY', 'NAMED_DATASET'),
      {},
      ['/dashboard', '/explorer', '/api', '/dataset', '/help'],
    ],
    [
      'BDC authorized access and named datasets',
      signedIn('AUTHORIZED_ACCESS', 'MANUAL_PRIV_NAMED_DATASET'),
      {},
      ['/dashboard', '/explorer', '/api', '/dataset', '/help'],
    ],
    ['named datasets without query access', signedIn('NAMED_DATASET'), {}, PUBLIC],
    [
      'an admin',
      signedIn('PIC_SURE_ANY_QUERY', 'ADMIN'),
      {},
      ['/dashboard', '/explorer', '/api', '/admin/configuration', '/admin/users', '/help'],
    ],
    [
      'a super admin',
      signedIn('PIC_SURE_ANY_QUERY', 'SUPER_ADMIN'),
      {},
      ['/dashboard', '/explorer', '/api', '/admin/configuration', '/admin/users', '/help'],
    ],
    // D3: the admin pages sit inside the ones that need query access.
    ['an admin without query access', signedIn('ADMIN', 'NAMED_DATASET'), {}, PUBLIC],
    ['a super admin without query access', signedIn('SUPER_ADMIN'), {}, PUBLIC],
    [
      'features off',
      signedIn('PIC_SURE_ANY_QUERY'),
      { dashboard: false, analyzeApi: false, discover: true },
      ['/discover', '/explorer', '/help'],
    ],
  ])('%s', (_name, user, overrides, paths) => {
    expect(routesFor(user, features(overrides)).map((route) => route.path)).toEqual(paths);
  });
});

describe('showsLink', () => {
  it.each<[string, string, User | undefined, Record<string, unknown>, boolean]>([
    ['another site', 'https://example.org/admin/users', undefined, {}, true],
    ['an app page with no nav link', '/login', undefined, {}, true],
    [
      'an admin page, to an admin',
      '/admin/users',
      signedIn('PIC_SURE_ANY_QUERY', 'ADMIN'),
      {},
      true,
    ],
    [
      'an admin page, to an admin without query access',
      '/admin/users',
      signedIn('ADMIN'),
      {},
      false,
    ],
    // The footer follows Explore's guard, not its nav link.
    [
      'Explore, to a signed-in user without query access',
      '/explorer',
      signedIn('DICTIONARY'),
      {},
      true,
    ],
    ['a nav page with a query string', '/explorer?search=age', undefined, {}, false],
    ['a page below a nav page', '/dataset/1234', signedIn('PIC_SURE_ANY_QUERY'), {}, false],
    [
      'a top-admin page below Configuration, to an admin',
      '/admin/configuration/role/new',
      signedIn('PIC_SURE_ANY_QUERY', 'ADMIN'),
      {},
      false,
    ],
    [
      'a top-admin page below Configuration, to a super admin',
      '/admin/configuration/role/new',
      signedIn('PIC_SURE_ANY_QUERY', 'SUPER_ADMIN'),
      {},
      true,
    ],
    ['a page whose feature is off', '/api#docs', undefined, { analyzeApi: false }, false],
    ['a path that only starts like a nav link', '/apis', undefined, { analyzeApi: false }, true],
  ])('%s', (_name, href, user, overrides, shown) => {
    expect(showsLink(href, user, features(overrides))).toBe(shown);
  });
});
