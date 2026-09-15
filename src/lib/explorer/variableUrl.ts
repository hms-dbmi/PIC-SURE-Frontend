import type { SearchResult } from '$lib/models/Search';

import { searchSectionRoot, withSearchTerm, type SearchSection } from '$lib/explorer/searchChrome';

/**
 * What identifies a variable in a URL.
 *
 * The dictionary has no slug field yet, and concept detail needs both halves of the key -
 * `POST /dict/concepts/detail/{dataset}` carries the concept path in its body - so the URL
 * carries both. `objectUUID` is not an option: it hashes against a `SESSION_NAMESPACE`
 * regenerated on every page load (`$lib/utilities/UUID.ts`), so any id the frontend mints
 * dies on refresh, and a v5 hash is one-way besides.
 *
 * Everything that turns a variable into a URL, or a URL back into a variable, goes through
 * this module. That is the point of it: when the dictionary grows a stable slug, this file
 * plus a redirect for the old URL shape is the whole change.
 */
export type VariableKey = {
  dataset: string;
  conceptPath: string;
};

/**
 * The route segment beneath the section root that owns variable detail pages. It has to agree
 * with the `variable/` route directory under both sections, which `tests/unit/variableUrl`
 * asserts, since nothing in the type system connects a string to a directory name.
 */
export const VARIABLE_SEGMENT = 'variable';

/** The two path segments that identify a variable, percent-encoded for a URL. */
export function encodeVariableKey({ dataset, conceptPath }: VariableKey): string {
  return `${encodeURIComponent(dataset)}/${encodeURIComponent(conceptPath)}`;
}

/**
 * What a dataset name may contain.
 *
 * An allow-list, and a security control rather than a tidiness one. The dataset is
 * interpolated into a request path by `$lib/stores/Dictionary`, and SvelteKit decodes `%2F`
 * and `%5C` only *after* matching routes - so `..%2F..%2F..%2Fpsama%2FstudyAccess` arrives
 * here as one parameter reading `../../../psama/studyAccess`. Left alone, that walks the
 * authenticated, token-bearing POST out of the dictionary namespace and onto another
 * same-origin endpoint. Nothing outside this set can leave its path segment.
 *
 * The space is here because real dataset names have them: `pathToSearchResult` derives the
 * dataset from a concept path's first segment, and those look like
 * `_Topmed Study Accession with Subject ID`.
 */
const SAFE_DATASET = /^[A-Za-z0-9 ._-]+$/;

/**
 * A concept path is dictionary data - backslash-delimited, with spaces, punctuation and
 * non-ASCII text all legitimate - so it gets a shape check rather than a charset one. It
 * only ever travels in a request body (`POST /dict/concepts/detail/{dataset}` carries it),
 * never in a path, so it is not a traversal vector. Control characters are the only thing
 * that cannot be part of a real concept path.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/**
 * Whether this app will act on these two halves - the one definition, used by both ends of
 * the URL.
 *
 * The builder and the route validator used to apply this rule separately and agree only by
 * convention. That cost nothing while the only way to reach the detail route was to type a
 * URL, because the sole input was something a person had written. The result cards made it
 * the gate on every search result, where the input is dictionary text: the dataset is derived
 * from a concept path's first segment (see `SAFE_DATASET` below), so whether a link works is
 * decided by how a study was named. Two copies of the rule there means a card that renders
 * correctly and opens onto "We could not read that variable link", for every variable in that
 * dataset, with nothing on the card to say so.
 *
 * So `variableDetailHref` refuses to build what this rejects, and the card renders itself
 * unopenable rather than carrying a dead link. Widening the rule is a separate decision -
 * this is a security control, not a tidiness one, and the note on `SAFE_DATASET` says what it
 * is holding back.
 */
export function isLinkableVariableKey(key: { dataset?: string; conceptPath?: string }): boolean {
  const { dataset = '', conceptPath = '' } = key;
  if (!SAFE_DATASET.test(dataset)) return false;
  // `..` passes the charset on its own, and is the whole traversal token.
  if (dataset.includes('..')) return false;
  // Spaces and dots alone address no dataset.
  if (!/[A-Za-z0-9]/.test(dataset)) return false;
  // The concept path is trimmed only to judge presence: whitespace inside one is meaningful,
  // and a key that came back trimmed would no longer address the concept it was built from.
  if (!conceptPath.trim() || CONTROL_CHARACTERS.test(conceptPath)) return false;
  return true;
}

/**
 * The key a route's params carry, or `undefined` when they carry nothing this page may act
 * on - which the page renders as a readable error rather than passing to the dictionary.
 *
 * This is the decode half of the URL key: SvelteKit percent-decodes route params before a
 * load sees them, so what is left is to judge what arrived. Both route loaders go through
 * here, so the path these values take in production is the path the tests exercise.
 */
export function variableKeyFromParams(params: {
  dataset?: string;
  conceptPath?: string;
}): VariableKey | undefined {
  const { dataset = '', conceptPath = '' } = params;
  return isLinkableVariableKey({ dataset, conceptPath }) ? { dataset, conceptPath } : undefined;
}

/**
 * The detail-page href for a search result, in the section the user is searching in, or
 * `undefined` when the route would refuse the key it is made of.
 *
 * `undefined` rather than a link the detail page turns into an error: a card is the only way
 * into that page now, so a link this module knows is dead is worse than no link at all. The
 * caller decides how to show it, but it cannot accidentally ship one.
 *
 * `searchTerm` travels in the URL for the same reason the mode bar's links carry it:
 * `?search=` is authoritative on every navigation, so a copied or bookmarked detail link has
 * to carry the search it came from, or Back to Search Results lands on empty results.
 */
export function variableDetailHref(
  section: SearchSection,
  result: Pick<SearchResult, 'dataset' | 'conceptPath'>,
  searchTerm = '',
): string | undefined {
  if (!isLinkableVariableKey(result)) return undefined;
  const key = encodeVariableKey({ dataset: result.dataset, conceptPath: result.conceptPath });
  return withSearchTerm(`${searchSectionRoot(section)}/${VARIABLE_SEGMENT}/${key}`, searchTerm);
}
