import { describe, expect, it } from 'vitest';
import { showsSearchChrome } from '$lib/explorer/searchChrome';

describe('showsSearchChrome', () => {
  it('shows the chrome on the Explore and Discover results pages', () => {
    expect(showsSearchChrome('/explorer')).toBe(true);
    expect(showsSearchChrome('/discover')).toBe(true);
  });

  it('shows the chrome on the child routes that keep the search above them', () => {
    expect(showsSearchChrome('/explorer/advanced-filtering')).toBe(true);
    expect(showsSearchChrome('/explorer/genome-filter')).toBe(true);
    expect(showsSearchChrome('/explorer/variant')).toBe(true);
    expect(showsSearchChrome('/discover/advanced-filtering')).toBe(true);
  });

  it('hides the chrome on the full-page export and distributions routes', () => {
    expect(showsSearchChrome('/explorer/export')).toBe(false);
    expect(showsSearchChrome('/explorer/distributions')).toBe(false);
    expect(showsSearchChrome('/discover/distributions')).toBe(false);
  });

  it('hides the chrome outside Explore and Discover', () => {
    expect(showsSearchChrome('/')).toBe(false);
    expect(showsSearchChrome('/dashboard')).toBe(false);
    expect(showsSearchChrome('/dataset')).toBe(false);
    expect(showsSearchChrome('/analyze')).toBe(false);
  });

  it('ignores a trailing slash and a base path', () => {
    expect(showsSearchChrome('/explorer/')).toBe(true);
    expect(showsSearchChrome('/picsure/explorer')).toBe(true);
    expect(showsSearchChrome('/picsure/explorer/export')).toBe(false);
  });

  it('is total for the degenerate pathnames a caller can hand it', () => {
    expect(showsSearchChrome('')).toBe(false);
    expect(showsSearchChrome(undefined as unknown as string)).toBe(false);
    expect(showsSearchChrome(null as unknown as string)).toBe(false);
  });
});
