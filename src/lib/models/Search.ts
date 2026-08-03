import type { Indexable } from '$lib/types';

export type Facet = Indexable & {
  name: string;
  display: string;
  description: string;
  count: number;
  children?: Facet[];
  category: string;
  categoryRef?: ShallowFacetCategory;
  parentRef?: ShallowFacetCategory;
};

/**
 * The only two members of a facet the server accepts as a *filter*.
 *
 * The dictionary service binds request bodies strictly
 * (`FAIL_ON_UNKNOWN_PROPERTIES`) and its nested `Facet` record —
 * `Facet(name, display, description, fullName, count, children, category, meta)`
 * — is NOT tolerant of extra members, unlike the top-level `Filter`. The UI-only
 * `categoryRef` / `parentRef` back-references that {@link Facet} carries are
 * therefore a 400 the moment a selected facet is echoed back to
 * `POST /dictionary/facets` or `POST /dictionary/concepts`.
 *
 * `(name, category)` is the filter key — the Java record has a convenience
 * constructor for exactly that pair — and everything else on a response facet
 * (display, count, children) is meaningless as an input. Build outbound facets
 * with `toFacetFilter` in `$lib/stores/Dictionary`, never by hand: `Facet` is
 * structurally assignable to this type, so the compiler will not catch it for you.
 */
export type FacetFilter = {
  name: string;
  category: string;
};

export type PreviousCategoriesForPlaceholder = {
  numFacets: number;
  showSearchAndButton?: boolean;
};

export type ShallowFacetCategory = Pick<Facet, 'name' | 'display' | 'description'>;

export type SearchResult = Indexable & {
  conceptPath: string;
  dataset: string;
  name: string;
  display: string;
  studyAcronym: string;
  description: string;
  values?: string[];
  min?: number;
  max?: number;
  meta?: Record<string, unknown> | null;
  table?: SearchResult | null;
  study?: SearchResult | null;
  fullName?: string;
  ref?: string;
  abbreviation?: string;
  type: 'Categorical' | 'Continuous' | 'AnyRecordOf';
  allowFiltering: boolean;
  children?: SearchResult[] | null;
};
