export type SearchSection = 'explorer' | 'discover';

/** Route segment directly under the section root that keeps its own full-page presentation. */
const FULL_PAGE_ROUTES = ['export', 'distributions'];

function segments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

/**
 * Where a pathname sits in the search section: which of Explore or Discover owns it, and the
 * route segment directly beneath. Matching is by segment, not substring, because segments
 * below the first one can come from dictionary data - a variable named `age-at-export` must
 * not read as the Export route, and one named `discover` must not read as Discover.
 */
export function searchRoute(pathname: string): { section?: SearchSection; child?: string } {
  const parts = segments(pathname);
  // Search for the root rather than assuming parts[0], so a deployment served under a base
  // path still resolves. First match wins: the section is the outermost one.
  const root = parts.findIndex((part) => part === 'explorer' || part === 'discover');
  if (root === -1) return {};
  return { section: parts[root] as SearchSection, child: parts[root + 1] };
}

export function isDiscoverSection(pathname: string): boolean {
  return searchRoute(pathname).section === 'discover';
}

/**
 * Whether a route shows the search chrome - the cohort summary panel and the search-mode tab
 * bar. Both render from the /explorer and /discover layouts, so the rule lives here instead
 * of being spelled out in each of them.
 *
 * Export and Distributions are excluded: they keep their own full-page presentation.
 */
export function showsSearchChrome(pathname: string): boolean {
  const { section, child } = searchRoute(pathname);
  return section !== undefined && !FULL_PAGE_ROUTES.includes(child ?? '');
}

/**
 * The section's root route: the Phenotypes results page, and where the variable detail page's
 * Back to Search Results returns to.
 */
export function searchSectionRoot(section: SearchSection): string {
  return `/${section}`;
}

/**
 * A search-section href carrying the term the user is looking at, so switching routes, Copy
 * Link and middle-click all keep it. `?search=` is authoritative on every navigation, so the
 * term has to travel in the URL or the address bar stops agreeing with the results on screen.
 */
export function withSearchTerm(route: string, searchTerm: string): string {
  return searchTerm ? `${route}?search=${encodeURIComponent(searchTerm)}` : route;
}
