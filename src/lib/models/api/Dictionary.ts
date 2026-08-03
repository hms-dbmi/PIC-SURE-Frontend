import { type SearchResult } from '$lib/models/Search';
import type { PaginatedResponse } from '$lib/models/api/QueryStatus';
import type { Facet, FacetFilter } from '$lib/models/Search';

/**
 * `POST /dictionary/concepts` — a PaginatedResponse, not a Spring `Page`.
 * `content` is now `results` and `totalElements` is `total`; `number`,
 * `totalPages`, `first`, `last`, `empty`, `size`, `numberOfElements` and
 * `pageable` are gone.
 *
 * `page` is ZERO-based on this endpoint (`page_number` / `page_size` query
 * params, default size 10). HPDS's `/search/values` pages from 1 — the two
 * surfaces do not share a base.
 */
export type DictionaryConceptResult = PaginatedResponse<SearchResult>;

/**
 * A single concept path to look up. `/concepts/detail/{dataset}`,
 * `/concepts/tree/{dataset}` and `/concepts/hierarchy/{dataset}` take this
 * JSON object; they used to take the raw, unquoted path as the whole body,
 * which was not even valid JSON. Backslashes are JSON-escaped by
 * `JSON.stringify` on the way out.
 */
export interface ConceptPathRequest {
  conceptPath: string;
}

/** A free-text search over the concepts a resource exposes. */
export interface SearchRequest {
  query: string;
}

export interface DictionaryFacetResult {
  name: string;
  display: string;
  description: string;
  facets: Facet[];
}

/**
 * The body of `POST /dictionary/facets` and `POST /dictionary/concepts`.
 *
 * `facets` is a list of {@link FacetFilter}, NOT the {@link Facet} objects the
 * facets endpoint hands back: the server's nested `Facet` record rejects
 * unknown members, so echoing a selected facet — with the UI-only
 * `categoryRef` / `parentRef` — is a 400. Produce this list with
 * `toFacetFilter`; `Facet` is structurally assignable to `FacetFilter`, so the
 * type alone is documentation, not enforcement.
 *
 * `consents` maps to `List<String>` on the server. Omit it rather than sending
 * a malformed value — a non-list, or a list of non-strings, is a 400 at bind time.
 */
export interface DictionarySearchRequest {
  facets: FacetFilter[];
  search: string;
  consents?: string[];
}
