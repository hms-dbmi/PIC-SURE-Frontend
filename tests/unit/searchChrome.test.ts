import { describe, it, expect } from 'vitest';

import {
  isDiscoverSection,
  isExploreSection,
  searchRoute,
  searchSectionRoot,
  showsSearchChrome,
  withSearchTerm,
} from '$lib/explorer/searchChrome';

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

// The stigmatising-filter guard in (picsure)/+layout.svelte asks these two which section a
// path belongs to. It used substring matching, which a variable detail URL defeats: the
// dataset rides in the pathname, so `/discover/variable/explorer/...` read as being inside
// Explore already and the notAuthorized arm never fired.
describe('isExploreSection', () => {
  it.each(['/explorer', '/explorer/', '/explorer/genotypes', '/picsure/explorer'])(
    'is true for %s',
    (pathname) => expect(isExploreSection(pathname)).toBe(true),
  );

  it.each(['/discover', '/discover/advanced-filtering', '/dashboard', ''])(
    'is false for %s',
    (pathname) => expect(isExploreSection(pathname)).toBe(false),
  );

  it('is false when only a deeper segment spells explorer', () => {
    expect(isExploreSection('/discover/variable/explorer/%5Cx%5C')).toBe(false);
    expect(isDiscoverSection('/discover/variable/explorer/%5Cx%5C')).toBe(true);
  });

  it('is true when only a deeper segment spells discover', () => {
    expect(isExploreSection('/explorer/variable/discover/%5Cx%5C')).toBe(true);
    expect(isDiscoverSection('/explorer/variable/discover/%5Cx%5C')).toBe(false);
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
    // The live shape of the detail URL: dataset then percent-encoded concept path.
    '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
    '/explorer/variable/export/%5Cexport%5Cdistributions%5C',
    '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
  ])('keeps the chrome on the variable detail page %s', (pathname) => {
    expect(showsSearchChrome(pathname)).toBe(true);
  });

  it('resolves under a base path', () => {
    expect(showsSearchChrome('/picsure/explorer')).toBe(true);
    expect(showsSearchChrome('/picsure/discover/distributions')).toBe(false);
  });
});

describe('searchSectionRoot', () => {
  it('is the section root, which is where Back to Search Results goes', () => {
    expect(searchSectionRoot('explorer')).toBe('/explorer');
    expect(searchSectionRoot('discover')).toBe('/discover');
  });
});

// One definition of "carry the search in the href", shared by the mode bar's links, the
// result cards and the detail page's Back button.
describe('withSearchTerm', () => {
  it('appends the term, encoded', () => {
    expect(withSearchTerm('/explorer', 'age')).toBe('/explorer?search=age');
    expect(withSearchTerm('/discover', 'age at exam & more')).toBe(
      '/discover?search=age%20at%20exam%20%26%20more',
    );
  });

  it('is the bare route when there is no search', () => {
    expect(withSearchTerm('/explorer', '')).toBe('/explorer');
  });
});
