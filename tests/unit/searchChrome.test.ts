import { describe, it, expect } from 'vitest';

import { showsSearchChrome } from '$lib/explorer/searchChrome';

describe('showsSearchChrome', () => {
  it.each([
    '/explorer',
    '/explorer/',
    '/explorer/genotypes',
    '/explorer/advanced-filtering',
    '/explorer/variant',
    '/explorer/genome-filter',
    '/discover',
    '/discover/advanced-filtering',
  ])('shows the chrome on %s', (pathname) => {
    expect(showsSearchChrome(pathname)).toBe(true);
  });

  // Export and Distributions keep their own full-page presentation, exactly as the
  // showSidebar rule in (picsure)/+layout.svelte has it today.
  it.each([
    '/explorer/export',
    '/explorer/distributions',
    '/discover/distributions',
    '/explorer/export/anything',
  ])('hides the chrome on %s', (pathname) => {
    expect(showsSearchChrome(pathname)).toBe(false);
  });

  it.each(['/', '', '/dashboard', '/dataset', '/analyze/api', '/login', '/admin/configuration'])(
    'hides the chrome outside the search section, on %s',
    (pathname) => {
      expect(showsSearchChrome(pathname)).toBe(false);
    },
  );

  // Substring matching, inherited deliberately from showSidebar: a base path or a nested
  // segment still counts as the search section.
  it('matches on substring, so a base path or a nested segment still counts', () => {
    expect(showsSearchChrome('/picsure/explorer')).toBe(true);
    expect(showsSearchChrome('/explorer/variable/asthma')).toBe(true);
    expect(showsSearchChrome('/picsure/discover/distributions')).toBe(false);
  });
});
