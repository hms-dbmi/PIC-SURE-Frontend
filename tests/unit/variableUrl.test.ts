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
  isLinkableVariableKey,
  SAFE_DATASET_CHARACTERS,
  VARIABLE_SEGMENT,
  variableDetailHref,
  variableKeyFromParams,
  type VariableKey,
} from '$lib/explorer/variableUrl';

/** The href for a key this module is expected to accept. Fails loudly if it refused. */
function href(section: 'explorer' | 'discover', key: VariableKey, searchTerm = ''): string {
  const built = variableDetailHref(section, key, searchTerm);
  expect(built).toBeDefined();
  return built as string;
}

// The detail page has no slug to key on yet, so its URL carries the dataset and the concept
// path - the two things `getConceptDetails` needs. These tests pin the round trip through
// that URL, because a concept path is dictionary data full of backslashes, spaces and
// punctuation, and a key that does not survive the trip means a page that cannot load.
//
// They also pin the dataset's charset, which is a security control: the dataset is
// interpolated into a request path, and SvelteKit decodes `%2F` only after matching routes.

/**
 * A lone UTF-16 surrogate, and the paired form.
 *
 * `JSON.parse` yields a lone one from a `\ud800` escape, so malformed dictionary text reaches
 * a card as an ordinary string, and `encodeURIComponent` raises `URIError` rather than
 * encoding it. The pair is ordinary text outside the BMP and has to keep working: it is the
 * fixture that tells a fix which rejects *unpaired* surrogates apart from one that rejects
 * every surrogate, and the second would drop emoji and historic scripts out of the dictionary.
 */
const LONE_HIGH_SURROGATE = '\uD800';
const LONE_LOW_SURROGATE = '\uDC00';
const SURROGATE_PAIR = '\uD800\uDC00';

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
  // `-` was the one character `SAFE_DATASET` permits that this table omitted, which is how a
  // divergence on it went unnoticed. The per-character block below is what stops an omission
  // recurring; this entry also puts a hyphen through the round-trip and search-chrome blocks.
  'a hyphenated dataset': { dataset: 'phs000007-c1', conceptPath: '\\a\\b\\' },
  // Text outside the BMP is a surrogate *pair*, and encodes to `%F0%90%80%80` perfectly well.
  'text outside the BMP': { dataset: 'phs123', conceptPath: `\\phs123\\${SURROGATE_PAIR}\\` },
};

/**
 * Datasets that could leave their path segment, and the re-encoded and scheme-shaped variants
 * that go with them. Shared by the rejection block and by the builder/route agreement block
 * below, so the two cannot drift apart into testing different sets.
 */
const TRAVERSAL_DATASETS = [
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
];

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

/**
 * A dataset whose only varying part is the character under test, with alphanumerics either
 * side so that nothing else in the rule - the `..` token, the "must contain an alphanumeric"
 * check - is what decides the case.
 */
const datasetContaining = (character: string) => `phs123${character}x`;

/** Each character of a set, as an `it.each` row whose name survives being a space. */
const characterRows = (characters: Iterable<string>) =>
  [...characters].map((character) => ({ character, name: JSON.stringify(character) }));

describe('the variable URL key', () => {
  describe('round trips', () => {
    it.each(Object.entries(keys))(
      'survives a real URL and SvelteKit param decoding with %s',
      (_name, key) => {
        expect(variableKeyFromParams(paramsFromHref(href('explorer', key)))).toEqual(key);
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
    it.each(TRAVERSAL_DATASETS)('rejects %s', (dataset) => {
      expect(variableKeyFromParams({ dataset, conceptPath: '\\a\\b\\' })).toBeUndefined();
    });

    it('rejects it whatever the concept path says', () => {
      expect(
        variableKeyFromParams({ dataset: '../../psama/studyAccess', conceptPath: 'ATTACKER' }),
      ).toBeUndefined();
    });
  });

  /**
   * One definition, used by both ends of the URL.
   *
   * These two ends were written for different threat models and used to agree only by
   * convention. That cost nothing while the only way to reach the route was to type a URL;
   * once the result cards link here it is the gate on every search result, and the input is
   * dictionary text rather than something a person typed. A dataset the builder was happy
   * with but the route refuses is a card that renders correctly and opens onto an error page,
   * for every variable in that dataset, with nothing on the card to say so.
   */
  describe('the builder and the route agree', () => {
    const REFUSED_BY_THE_ROUTE = [
      ...TRAVERSAL_DATASETS,
      // Not attacks - shapes a dictionary could plausibly emit, all outside SAFE_DATASET.
      'BioLINCC (phs004266)',
      'phs000179:v1.p2',
      'a+b',
      'a&b',
      'a,b',
      "Age a l'examen",
      'Âge',
      '',
      '   ',
    ];

    it.each(REFUSED_BY_THE_ROUTE)('builds no link for %s, which the route refuses', (dataset) => {
      const key = { dataset, conceptPath: '\\a\\b\\' };
      // The premise: this is a key the route will not act on.
      expect(variableKeyFromParams(key)).toBeUndefined();
      // So there is no link to give a card. Anything else is a dead link with no signal.
      expect(variableDetailHref('explorer', key)).toBeUndefined();
      expect(variableDetailHref('discover', key)).toBeUndefined();
    });

    it.each([
      { case: 'a blank concept path', conceptPath: '   ' },
      { case: 'a missing concept path', conceptPath: '' },
      {
        case: 'a concept path with a control character',
        conceptPath: `\\a\\b\\${String.fromCharCode(0)}`,
      },
      // These two classes are not a disagreement about what is allowed - both ends said yes.
      // The builder then threw, or built an href that goes somewhere else. Accept-then-throw
      // is the disagreement the "one definition" claim did not cover.
      {
        case: 'a lone high surrogate in the concept path',
        conceptPath: `\\a\\${LONE_HIGH_SURROGATE}\\`,
      },
      {
        case: 'a lone low surrogate in the concept path',
        conceptPath: `\\a\\${LONE_LOW_SURROGATE}\\`,
      },
      // Dot segments, which the URL parser removes. Encoding does not help: it reads `%2E%2E`
      // back as `..`, so the href would resolve above the route it was built for. The dataset
      // half was guarded against this by hand and the concept-path half was not.
      { case: 'a concept path that is a dot segment', conceptPath: '..' },
      { case: 'a concept path that is a bare dot', conceptPath: '.' },
    ])('builds no link when the concept path is refused: $case', ({ conceptPath }) => {
      const key = { dataset: 'phs123', conceptPath };
      expect(variableKeyFromParams(key)).toBeUndefined();
      // Named before the value is read, because the two failures are different findings: a
      // `URIError` out of `variableDetailHref` reads as a broken test rather than as a card
      // that took the result list down with it.
      expect(() => variableDetailHref('explorer', key)).not.toThrow();
      expect(variableDetailHref('explorer', key)).toBeUndefined();
      expect(variableDetailHref('discover', key)).toBeUndefined();
    });

    // The other direction: whatever it does build has to survive the round trip into a key
    // the route acts on. `keys` is the table of everything this module claims to support.
    it.each(Object.entries(keys))('builds a link the route accepts for %s', (_name, key) => {
      expect(isLinkableVariableKey(key)).toBe(true);
      expect(variableKeyFromParams(paramsFromHref(href('explorer', key)))).toEqual(key);
    });

    it('answers the same question for both ends', () => {
      for (const dataset of [
        ...REFUSED_BY_THE_ROUTE,
        'phs123',
        'test_data_set.v1.p1',
        // From the allow-list rather than by hand, so the sameness claim covers every
        // character the set permits and cannot quietly omit one.
        ...[...SAFE_DATASET_CHARACTERS].map(datasetContaining),
      ]) {
        const key = { dataset, conceptPath: '\\a\\b\\' };
        expect(isLinkableVariableKey(key)).toBe(variableKeyFromParams(key) !== undefined);
        expect(isLinkableVariableKey(key)).toBe(variableDetailHref('explorer', key) !== undefined);
      }
    });

    /**
     * Derived from the allow-list, not from a table.
     *
     * `keys` above is a hand-written list of datasets that ought to work, which makes it a
     * second implementation of `SAFE_DATASET_CHARACTERS` - and a second implementation can
     * omit a member. It did: it exercised every character the allow-list permits except `-`.
     * Adding `if (dataset.includes('-')) return undefined;` to `variableKeyFromParams` - one
     * end accepting what the other refuses, on an allow-listed character, which is the entire
     * bug class this module exists to prevent - left all 971 tests green.
     *
     * So these cases come from the set itself. A character added to or taken out of the
     * allow-list changes what runs here with nobody having to remember a table.
     */
    describe('over every character the allow-list permits', () => {
      /**
       * That the exported set is the whole set, so deriving cases from it is not itself a
       * second implementation of `SAFE_DATASET`.
       *
       * Every code point rather than a sample, because the claim is that nothing outside this
       * string is accepted and a sample cannot make that claim. It costs about 40ms: the
       * predicate tests the charset first, so only the 66 members reach the URL probe.
       */
      it('is the complete set of characters a dataset may contain', () => {
        const accepted: string[] = [];
        for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
          const character = String.fromCodePoint(codePoint);
          if (isLinkableVariableKey({ dataset: `a${character}`, conceptPath: '\\a\\b\\' })) {
            accepted.push(character);
          }
        }
        expect(accepted.sort().join('')).toBe([...SAFE_DATASET_CHARACTERS].sort().join(''));
      });

      it.each(characterRows(SAFE_DATASET_CHARACTERS))(
        'builds a link the route reads the same key back out of, for $name',
        ({ character }) => {
          const key = { dataset: datasetContaining(character), conceptPath: '\\a\\b\\' };
          expect(isLinkableVariableKey(key)).toBe(true);
          // Both ends, and the trip between them: the route accepts the key as it stands, and
          // it also accepts what comes back out of a real URL built from it.
          expect(variableKeyFromParams(key)).toEqual(key);
          expect(variableKeyFromParams(paramsFromHref(href('explorer', key)))).toEqual(key);
        },
      );

      /*
       * The other side of the set. Printable ASCII is where a plausible dataset name lives,
       * and the filter is the allow-list itself rather than a second hand-written list of
       * what is meant to be outside it.
       */
      it.each(
        characterRows(
          Array.from({ length: 0x7f - 0x20 }, (_, offset) =>
            String.fromCharCode(0x20 + offset),
          ).filter((character) => !SAFE_DATASET_CHARACTERS.includes(character)),
        ),
      )('refuses at both ends a dataset containing $name', ({ character }) => {
        const key = { dataset: datasetContaining(character), conceptPath: '\\a\\b\\' };
        expect(isLinkableVariableKey(key)).toBe(false);
        expect(variableKeyFromParams(key)).toBeUndefined();
        expect(variableDetailHref('explorer', key)).toBeUndefined();
      });
    });
  });

  /**
   * The promise the predicate makes, as a property rather than as a list of inputs: anything
   * it accepts, the builder can build and the route can read back. Both round-2 findings
   * against it were inputs nobody had thought to put in a table - a lone surrogate and a dot
   * segment - so what is asserted here is "no input behaves otherwise", over a corpus that
   * includes the awkward ones.
   */
  describe('accepts nothing the builder cannot put in a URL', () => {
    const CONCEPT_PATHS = [
      ...Object.values(keys).map((key) => key.conceptPath),
      '',
      '   ',
      '.',
      '..',
      '...',
      'a..b',
      './a',
      '../..',
      // Already-encoded text, in case something downstream decodes twice.
      '%2E%2E',
      '%2F',
      LONE_HIGH_SURROGATE,
      LONE_LOW_SURROGATE,
      SURROGATE_PAIR,
      `\\a\\${LONE_HIGH_SURROGATE}\\`,
      `\\a\\${SURROGATE_PAIR}\\`,
      `\\a\\${String.fromCharCode(0)}`,
      '\\a\\\nb\\',
      '?',
      '#',
      '&x=1',
      '//evil.example/x',
      'http://evil.example/x',
    ];

    it('holds for every concept path, and refuses by returning rather than throwing', () => {
      let accepted = 0;
      for (const conceptPath of CONCEPT_PATHS) {
        const key = { dataset: 'phs123', conceptPath };
        if (!isLinkableVariableKey(key)) {
          // A refusal has to be a value: the card reads it in a `$derived`, where a throw
          // escapes the `{#each}` and takes every other result with it.
          expect(() => variableDetailHref('explorer', key)).not.toThrow();
          expect(variableDetailHref('explorer', key)).toBeUndefined();
          continue;
        }
        accepted += 1;
        expect(() => encodeVariableKey(key)).not.toThrow();
        expect(variableKeyFromParams(paramsFromHref(href('explorer', key)))).toEqual(key);
      }
      // Otherwise a predicate that refused everything would satisfy the loop above. Tied to
      // `keys`, which is the set this module declares it supports, so the floor rises with it
      // rather than being a number to remember.
      expect(accepted).toBeGreaterThanOrEqual(Object.keys(keys).length);
    });
  });

  /**
   * A row where the dictionary left one half null, which `SearchResult` says cannot happen.
   *
   * The cast is the finding. `models/Search.ts` types `dataset` and `conceptPath` as `string`,
   * but that is a claim about untrusted wire data rather than a runtime guarantee: the same
   * type marks `description`, `meta`, `table`, `study` and `children` as `| null`, and the
   * dictionary is a Java service, where Jackson serialises an absent field as `null` by
   * default. So the codebase already expects nulls from this endpoint; these two fields are
   * simply typed as though it does not.
   *
   * A destructuring default applies to `undefined` only, so `= ''` let a `null` through to
   * throw `TypeError` on `.includes` or `.trim()`. It threw inside the card's `$derived`, and
   * there is no `<svelte:boundary>` in `src/`, so it escaped the whole `{#each}`: in the built
   * app, zero cards and "No entries found." above a count still reading "1 - 7 / 7". One bad
   * row destroyed six good ones and misreported why.
   */
  describe('a row with a null half', () => {
    it.each([
      { case: 'a null concept path', dataset: 'phs123', conceptPath: null },
      { case: 'a null dataset', dataset: null, conceptPath: '\\a\\b\\' },
      { case: 'both halves null', dataset: null, conceptPath: null },
    ])('is refused, by returning rather than by throwing: $case', ({ dataset, conceptPath }) => {
      // No cast needed here: the predicate's parameter type now says what it accepts.
      expect(isLinkableVariableKey({ dataset, conceptPath })).toBe(false);

      const result = { dataset, conceptPath } as unknown as VariableKey;
      expect(() => variableDetailHref('explorer', result)).not.toThrow();
      expect(variableDetailHref('explorer', result)).toBeUndefined();
      expect(variableDetailHref('discover', result)).toBeUndefined();
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
      expect(href('explorer', result)).toBe(
        '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
      );
      expect(href('discover', result)).toBe(
        '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
      );
    });

    // Otherwise a copied detail link drops the search, and Back to Search Results lands on
    // an empty results page.
    it('carries the active search term, encoded', () => {
      expect(href('explorer', result, 'heart attack & more')).toBe(
        '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C?search=heart%20attack%20%26%20more',
      );
    });

    it('omits the query string when there is no search', () => {
      expect(href('explorer', result, '')).not.toContain('?');
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
      const { pathname } = new URL(href('explorer', key), 'http://localhost');
      expect(searchRoute(pathname)).toEqual({ section: 'explorer', child: 'variable' });
      expect(showsSearchChrome(pathname)).toBe(true);
      expect(phenotypesMode.isActive(pathname)).toBe(true);
      expect(genotypesMode.isActive(pathname)).toBe(false);
    });

    it.each(Object.entries(keys))('on Discover with %s', (_name, key) => {
      const { pathname } = new URL(href('discover', key), 'http://localhost');
      expect(searchRoute(pathname)).toEqual({ section: 'discover', child: 'variable' });
      expect(showsSearchChrome(pathname)).toBe(true);
      expect(phenotypesMode.isActive(pathname)).toBe(true);
    });
  });
});
