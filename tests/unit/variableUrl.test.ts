import { describe, expect, it, vi } from 'vitest';

// searchModes reads config at import time; nothing under test needs a real one.
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { enableGENEQuery: true, enableSNPQuery: false } },
}));

import { searchRoute, showsSearchChrome } from '$lib/explorer/searchChrome';
import { genotypesMode, phenotypesMode } from '$lib/explorer/searchModes';
import {
  decodeVariableKey,
  encodeVariableKey,
  variableDetailHref,
  variableKeyFromParams,
  variableKeyOf,
  type VariableKey,
} from '$lib/explorer/variableUrl';

// The detail page has no slug to key on yet, so its URL carries the dataset and the concept
// path - the two things `getConceptDetails` needs. These tests pin the round trip through
// that URL, because a concept path is dictionary data full of backslashes, spaces and
// punctuation, and a key that does not survive the trip means a page that cannot load.

const keys: Record<string, VariableKey> = {
  'backslashes and spaces': {
    dataset: 'test_data_set',
    conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Any family with heart attack?\\',
  },
  'only backslashes': { dataset: 'phs123', conceptPath: '\\phs123\\age\\' },
  'a percent sign': { dataset: 'phs123', conceptPath: '\\phs123\\100% of the time\\' },
  'a forward slash': { dataset: 'phs123', conceptPath: '\\phs123\\systolic/diastolic\\' },
  'url punctuation': { dataset: 'phs123', conceptPath: '\\phs123\\a#b&c+d=e?f\\' },
  'non-ascii text': { dataset: 'phs123', conceptPath: "\\phs123\\Âge à l'examen\\" },
  'a dotted dataset': { dataset: 'test_data_set.v1.p1', conceptPath: '\\a\\b\\' },
  'a dataset that spells a route': { dataset: 'discover', conceptPath: '\\a\\export\\' },
  'trailing whitespace inside the path': { dataset: 'phs123', conceptPath: '\\phs123\\age \\' },
};

/**
 * How SvelteKit hands a URL's segments to a load: it decodes the pathname and then each param
 * (`decode_pathname` then `decode_params`, `@sveltejs/kit/src/utils/url.js`) before the
 * loader runs, which is why `variableKeyFromParams` only has to judge what arrives. Mirrored
 * here so the round trip covers the path the router actually takes, not just the module's own
 * two halves.
 */
function paramsFromHref(href: string): { dataset: string; conceptPath: string } {
  const [dataset, conceptPath] = new URL(href, 'http://localhost').pathname
    .split('/')
    .slice(3)
    .map(decodeURIComponent);
  return { dataset, conceptPath };
}

describe('the variable URL key', () => {
  describe('round trips', () => {
    it.each(Object.entries(keys))('survives encode then decode with %s', (_name, key) => {
      expect(decodeVariableKey(encodeVariableKey(key))).toEqual(key);
    });

    it.each(Object.entries(keys))(
      'survives a real URL and SvelteKit param decoding with %s',
      (_name, key) => {
        const href = variableDetailHref('explorer', key);
        expect(variableKeyFromParams(paramsFromHref(href))).toEqual(key);
      },
    );

    it('leaves nothing in the URL that needs escaping again', () => {
      const encoded = encodeVariableKey(keys['backslashes and spaces']);
      expect(encoded).toBe(
        'test_data_set/%5CSOMEDATA%5Cquestionnaire%5Cdisease%5CAny%20family%20with%20heart%20attack%3F%5C',
      );
      // One separator only, so the two halves stay tellable apart however the concept path
      // is punctuated.
      expect(encoded.split('/')).toHaveLength(2);
    });
  });

  describe('keys that address nothing', () => {
    it.each([
      { case: 'no segments at all', params: {} },
      { case: 'no concept path', params: { dataset: 'phs123' } },
      { case: 'no dataset', params: { conceptPath: '\\a\\b\\' } },
      { case: 'a blank concept path', params: { dataset: 'phs123', conceptPath: '   ' } },
      { case: 'a blank dataset', params: { dataset: ' ', conceptPath: '\\a\\b\\' } },
    ])('are rejected from params: $case', ({ params }) => {
      expect(variableKeyFromParams(params)).toBeUndefined();
    });

    it.each([
      { case: 'no separator', segments: 'phs123' },
      { case: 'nothing but a separator', segments: '/' },
      { case: 'an empty dataset', segments: '/%5Ca%5C' },
      { case: 'an empty concept path', segments: 'phs123/' },
      { case: 'a malformed escape', segments: 'phs123/%zz' },
      { case: 'a lone escape character', segments: 'phs123/%' },
    ])('are rejected from URL segments: $case', ({ segments }) => {
      expect(decodeVariableKey(segments)).toBeUndefined();
    });
  });

  describe('hrefs', () => {
    const result = {
      dataset: 'test_data_set',
      conceptPath: '\\this\\is\\a\\age\\',
    };

    it('points at the section the user is searching in', () => {
      expect(variableDetailHref('explorer', result)).toBe(
        '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
      );
      expect(variableDetailHref('discover', result)).toBe(
        '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
      );
    });

    // Otherwise a copied detail link drops the search, and Back to Search Results lands on
    // an empty results page.
    it('carries the active search term, encoded', () => {
      expect(variableDetailHref('explorer', result, 'heart attack & more')).toBe(
        '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C?search=heart%20attack%20%26%20more',
      );
    });

    it('omits the query string when there is no search', () => {
      expect(variableDetailHref('explorer', result, '')).not.toContain('?');
    });

    it('reads only the key fields off a search result, which is what ticket 15 replaces', () => {
      const row = { ...result, name: 'age1', display: 'age' };
      expect(variableKeyOf(row)).toEqual(result);
    });
  });

  // The chrome rules match by segment, so a concept path is only safe in the URL if the
  // segment it lands in is never read as a route. These assert that against the real URLs
  // this module builds, rather than against hand-written pathnames.
  describe('the URLs it builds keep the search chrome', () => {
    it.each(Object.entries(keys))('on Explore with %s', (_name, key) => {
      const { pathname } = new URL(variableDetailHref('explorer', key), 'http://localhost');
      expect(searchRoute(pathname)).toEqual({ section: 'explorer', child: 'variable' });
      expect(showsSearchChrome(pathname)).toBe(true);
      expect(phenotypesMode.isActive(pathname)).toBe(true);
      expect(genotypesMode.isActive(pathname)).toBe(false);
    });

    it.each(Object.entries(keys))('on Discover with %s', (_name, key) => {
      const { pathname } = new URL(variableDetailHref('discover', key), 'http://localhost');
      expect(searchRoute(pathname)).toEqual({ section: 'discover', child: 'variable' });
      expect(showsSearchChrome(pathname)).toBe(true);
      expect(phenotypesMode.isActive(pathname)).toBe(true);
    });
  });
});
