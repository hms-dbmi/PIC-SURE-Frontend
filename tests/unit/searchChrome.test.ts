import { describe, expect, it } from 'vitest';

import { showsSearchChrome } from '$lib/explorer/searchChrome';

describe('showsSearchChrome', () => {
  it.each([
    '/explorer',
    '/discover',
    '/explorer/genotypes',
    '/explorer/advanced-filtering',
    '/discover/advanced-filtering',
    '/explorer/variant',
    '/explorer/genome-filter',
  ])('shows on %s', (pathname) => {
    expect(showsSearchChrome(pathname)).toBe(true);
  });

  it.each(['/explorer/export', '/explorer/distributions', '/discover/distributions'])(
    'hides on the full-page route %s',
    (pathname) => {
      expect(showsSearchChrome(pathname)).toBe(false);
    },
  );

  it.each(['/', '/help', '/dashboard', ''])(
    'hides outside the search section on %s',
    (pathname) => {
      expect(showsSearchChrome(pathname)).toBe(false);
    },
  );
});
