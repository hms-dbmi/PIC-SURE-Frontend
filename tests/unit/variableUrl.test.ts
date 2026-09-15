import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// searchModes reads config at import time; nothing under test needs a real one.
vi.mock('$lib/configuration.svelte', () => ({
  config: { features: { enableGENEQuery: true, enableSNPQuery: false } },
}));

import { searchRoute, showsSearchChrome } from '$lib/explorer/searchChrome';
import { genotypesMode, phenotypesMode } from '$lib/explorer/searchModes';
import {
  encodeVariableKey,
  VARIABLE_SEGMENT,
  variableDetailHref,
  variableKeyFromParams,
  type VariableKey,
} from '$lib/explorer/variableUrl';

// The detail page has no slug to key on yet, so its URL carries the dataset and the concept
// path - the two things `getConceptDetails` needs. These tests pin the round trip through
// that URL, because a concept path is dictionary data full of backslashes, spaces and
// punctuation, and a key that does not survive the trip means a page that cannot load.
//
// They also pin the dataset's charset, which is a security control: the dataset is
// interpolated into a request path, and SvelteKit decodes `%2F` only after matching routes.

const keys: Record<string, VariableKey> = {
  'backslashes and spaces': {
    dataset: 'test_data_set',
    conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Any family with heart attack?\\',
  },
  'only backslashes': { dataset: 'phs123', conceptPath: '\\phs123\\age\\' },
  'a percent sign': { dataset: 'phs123', conceptPath: '\\phs123\\100% of the time\\' },
  // Hypothetical: no fixture or observed dictionary content has a forward slash in a concept
  // path. Kept because nobody has ruled it out, but a green test here is NOT proof the case
  // works end to end - `/` encodes to `%2F`, which an Apache front end running the default
  // `AllowEncodedSlashes Off` rejects with a 404 before the app ever sees it. Real concept
  // paths are backslash-delimited, so they encode to `%5C` and pass under that default.
  'a forward slash': { dataset: 'phs123', conceptPath: '\\phs123\\systolic/diastolic\\' },
  'url punctuation': { dataset: 'phs123', conceptPath: '\\phs123\\a#b&c+d=e?f\\' },
  'non-ascii text': { dataset: 'phs123', conceptPath: "\\phs123\\Âge à l'examen\\" },
  'a dotted dataset': { dataset: 'test_data_set.v1.p1', conceptPath: '\\a\\b\\' },
  'a dataset that spells a route': { dataset: 'discover', conceptPath: '\\a\\export\\' },
  // `pathToSearchResult` derives the dataset from a concept path's first segment, and real
  // ones look like this.
  'a dataset with spaces': {
    dataset: '_Topmed Study Accession with Subject ID',
    conceptPath: '\\_Topmed Study Accession with Subject ID\\',
  },
  'trailing whitespace inside the path': { dataset: 'phs123', conceptPath: '\\phs123\\age \\' },
};

/**
 * How SvelteKit hands a URL's segments to a load: it decodes the pathname and then each param
 * (`decode_pathname` then `decode_params`, `@sveltejs/kit/src/utils/url.js`) before the
 * loader runs, which is why `variableKeyFromParams` only has to judge what arrives. Mirrored
 * here so the round trip covers the path the router actually takes - and the same path the
 * two `+page.ts` loaders take in production.
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
    it.each(Object.entries(keys))(
      'survives a real URL and SvelteKit param decoding with %s',
      (_name, key) => {
        expect(variableKeyFromParams(paramsFromHref(variableDetailHref('explorer', key)))).toEqual(
          key,
        );
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

  /**
   * The dataset lands in a request path (`POST /dict/concepts/detail/{dataset}`), and
   * `api.send` resolves that against `window.location.origin` - so `fetch` normalises `..`
   * segments and aims an authenticated, token-bearing POST wherever the path ends up.
   * `picsure/dictionary/concepts/detail/../../../../psama/studyAccess` resolves to
   * `/psama/studyAccess`, which is the URL, method and string-body shape of `addManualRole`.
   *
   * SvelteKit decodes `%2F` and `%5C` only after route matching, so all of these arrive as a
   * single `dataset` parameter. Rejecting them here is one of the two independent checks;
   * `$lib/stores/Dictionary` escapes the dataset at the request boundary as well.
   */
  describe('rejects a dataset that could leave its path segment', () => {
    it.each([
      '../../../../psama/studyAccess',
      '..\\..\\..\\..\\psama\\studyAccess',
      '..',
      '../psama',
      'a/b',
      'a\\b',
      'phs123/../../psama/studyAccess',
      // Re-encoded, in case something downstream decodes a second time.
      '%2F..%2Fpsama',
      'phs123%2E%2E',
      'phs123?x=1',
      'phs123#x',
      'phs123:8080',
      'a..b',
      '.',
      '...',
      'http://evil.example/x',
      '//evil.example/x',
    ])('rejects %s', (dataset) => {
      expect(variableKeyFromParams({ dataset, conceptPath: '\\a\\b\\' })).toBeUndefined();
    });

    it('rejects it whatever the concept path says', () => {
      expect(
        variableKeyFromParams({ dataset: '../../psama/studyAccess', conceptPath: 'ATTACKER' }),
      ).toBeUndefined();
    });
  });

  describe('keys that address nothing', () => {
    it.each([
      { case: 'no segments at all', params: {} },
      { case: 'no concept path', params: { dataset: 'phs123' } },
      { case: 'no dataset', params: { conceptPath: '\\a\\b\\' } },
      { case: 'a blank concept path', params: { dataset: 'phs123', conceptPath: '   ' } },
      { case: 'a blank dataset', params: { dataset: ' ', conceptPath: '\\a\\b\\' } },
      // Not a real concept path, and the kind of thing that turns up in an injected body.
      {
        case: 'a concept path with a control character',
        params: { dataset: 'phs123', conceptPath: `\\a\\b\\${String.fromCharCode(0)}` },
      },
      {
        case: 'a concept path with a newline',
        params: { dataset: 'phs123', conceptPath: '\\a\\\nb\\' },
      },
    ])('are rejected: $case', ({ params }) => {
      expect(variableKeyFromParams(params)).toBeUndefined();
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
  });

  // Nothing in the type system ties the constant to the directory it has to name, so a
  // rename on one side would produce hrefs that 404.
  describe('VARIABLE_SEGMENT', () => {
    it.each(['explorer', 'discover'])(
      'names a route directory that exists, under %s',
      (section) => {
        const route = path.join(
          'src/routes/(picsure)/(public)',
          section,
          VARIABLE_SEGMENT,
          '[dataset]/[conceptPath]/+page.ts',
        );
        expect(existsSync(path.resolve(import.meta.dirname, '../..', route))).toBe(true);
      },
    );
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
