import { describe, it, expect } from 'vitest';

import { isDiscoverSection, searchRoute, showsSearchChrome } from '$lib/explorer/searchChrome';

describe('searchRoute', () => {
  it('reads the section and the segment beneath it', () => {
    expect(searchRoute('/explorer')).toEqual({ section: 'explorer', child: undefined });
    expect(searchRoute('/explorer/genotypes')).toEqual({
      section: 'explorer',
      child: 'genotypes',
    });
    expect(searchRoute('/discover/advanced-filtering')).toEqual({
      section: 'discover',
      child: 'advanced-filtering',
    });
  });

  it('tolerates trailing slashes and doubled separators', () => {
    expect(searchRoute('/explorer/')).toEqual({ section: 'explorer', child: undefined });
    expect(searchRoute('//explorer//genotypes/')).toEqual({
      section: 'explorer',
      child: 'genotypes',
    });
  });

  it('resolves under a base path', () => {
    expect(searchRoute('/picsure/explorer/genotypes')).toEqual({
      section: 'explorer',
      child: 'genotypes',
    });
  });

  it.each(['', '/', '/dashboard', '/dataset/exploreration'])(
    'finds no section in %s',
    (pathname) => {
      expect(searchRoute(pathname)).toEqual({});
    },
  );
});

describe('isDiscoverSection', () => {
  it.each(['/discover', '/discover/', '/discover/distributions', '/picsure/discover'])(
    'is true for %s',
    (pathname) => expect(isDiscoverSection(pathname)).toBe(true),
  );

  it.each(['/explorer', '/explorer/genotypes', '/dashboard', ''])('is false for %s', (pathname) =>
    expect(isDiscoverSection(pathname)).toBe(false),
  );

  // Segment matching, not substring: variable detail slugs come from dictionary data, so a
  // variable named `discover` must not move the page into the Discover section.
  it('is false when a deeper segment merely spells discover', () => {
    expect(isDiscoverSection('/explorer/variable/discover')).toBe(false);
    expect(isDiscoverSection('/explorer/variable/rediscovery')).toBe(false);
  });
});

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

  // Export and Distributions keep their own full-page presentation.
  it.each([
    '/explorer/export',
    '/explorer/export/anything',
    '/explorer/distributions',
    '/discover/distributions',
  ])('hides the chrome on %s', (pathname) => {
    expect(showsSearchChrome(pathname)).toBe(false);
  });

  it.each(['/', '', '/dashboard', '/dataset', '/analyze/api', '/login', '/admin/configuration'])(
    'hides the chrome outside the search section, on %s',
    (pathname) => {
      expect(showsSearchChrome(pathname)).toBe(false);
    },
  );

  // Only the segment directly under the section root selects a route. Anything deeper is
  // dictionary-supplied and must not be read as one, or a variable page would silently lose
  // its tab bar and cohort panel.
  it.each([
    '/explorer/variable/age-at-export',
    '/explorer/variable/export',
    '/explorer/variable/distributions',
    '/explorer/variable/discover',
  ])('keeps the chrome on the variable detail page %s', (pathname) => {
    expect(showsSearchChrome(pathname)).toBe(true);
  });

  it('resolves under a base path', () => {
    expect(showsSearchChrome('/picsure/explorer')).toBe(true);
    expect(showsSearchChrome('/picsure/discover/distributions')).toBe(false);
  });
});
