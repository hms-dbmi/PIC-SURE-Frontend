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

/** The route segment beneath the section root that owns variable detail pages. */
export const VARIABLE_SEGMENT = 'variable';

/** What a search result needs to carry for its detail page to be addressable. */
export type VariableKeySource = Pick<SearchResult, 'dataset' | 'conceptPath'>;

/**
 * The key that addresses a search result's detail page. Ticket 15 makes this read the
 * dictionary's slug instead.
 */
export function variableKeyOf(result: VariableKeySource): VariableKey {
  return { dataset: result.dataset, conceptPath: result.conceptPath };
}

/** The two path segments that identify a variable, percent-encoded for a URL. */
export function encodeVariableKey({ dataset, conceptPath }: VariableKey): string {
  return `${encodeURIComponent(dataset)}/${encodeURIComponent(conceptPath)}`;
}

/**
 * The key a route's params carry, or `undefined` when they carry nothing usable - so callers
 * render an error instead of asking the dictionary about an empty concept path.
 *
 * SvelteKit percent-decodes route params before a load sees them, so this only has to judge
 * what arrived. `decodeVariableKey` is the half that does the decoding.
 */
export function variableKeyFromParams(params: {
  dataset?: string;
  conceptPath?: string;
}): VariableKey | undefined {
  const { dataset = '', conceptPath = '' } = params;
  // Trimmed only to judge presence: whitespace inside a concept path is meaningful, and a
  // key that came back trimmed would no longer address the concept it was built from.
  if (!dataset.trim() || !conceptPath.trim()) return undefined;
  return { dataset, conceptPath };
}

/**
 * The inverse of `encodeVariableKey`, over the still-encoded segments as they appear in the
 * URL. Used by the round-trip test, and by ticket 15's redirect from this URL shape to the
 * slug one.
 */
export function decodeVariableKey(segments: string): VariableKey | undefined {
  const separator = segments.indexOf('/');
  if (separator < 1) return undefined;
  try {
    return variableKeyFromParams({
      dataset: decodeURIComponent(segments.slice(0, separator)),
      conceptPath: decodeURIComponent(segments.slice(separator + 1)),
    });
  } catch {
    // decodeURIComponent throws URIError on a malformed escape, e.g. a hand-edited `%zz`.
    return undefined;
  }
}

/**
 * The detail-page href for a search result, in the section the user is searching in.
 *
 * `searchTerm` travels in the URL for the same reason the mode bar's links carry it:
 * `?search=` is authoritative on every navigation, so a copied or bookmarked detail link has
 * to carry the search it came from, or Back to Search Results lands on empty results.
 */
export function variableDetailHref(
  section: SearchSection,
  result: VariableKeySource,
  searchTerm = '',
): string {
  const key = encodeVariableKey(variableKeyOf(result));
  return withSearchTerm(`${searchSectionRoot(section)}/${VARIABLE_SEGMENT}/${key}`, searchTerm);
}
