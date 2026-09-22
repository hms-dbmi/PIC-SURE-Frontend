import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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

  describe('keys that address nothing', () => {
    it.each([
      { case: 'no segments at all', params: {} },
      { case: 'no concept path', params: { dataset: 'phs123' } },
      { case: 'no dataset', params: { conceptPath: '\\a\\b\\' } },
      { case: 'a blank concept path', params: { dataset: 'phs123', conceptPath: '   ' } },
      { case: 'a blank dataset', params: { dataset: ' ', conceptPath: '\\a\\b\\' } },
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
});
