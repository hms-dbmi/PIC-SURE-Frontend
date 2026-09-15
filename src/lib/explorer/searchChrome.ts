/**
 * The search chrome is everything Explore and Discover wrap their search in: the cohort
 * summary panel, and the search-mode tab bar that follows it. Both need the same rule, so it
 * lives here rather than in either component.
 *
 * `/explorer/export` and `/explorer/distributions` - and the Discover equivalents - present
 * full page and opt out. This is the rule the removed `showSidebar` in `(picsure)/+layout.svelte`
 * applied to the right-hand side panel.
 */
const SEARCH_ROOTS = ['/explorer', '/discover'];
const FULL_PAGE_SEGMENTS = ['/export', '/distributions'];

export function showsSearchChrome(pathname: string): boolean {
  if (!pathname) return false;
  return (
    SEARCH_ROOTS.some((root) => pathname.includes(root)) &&
    !FULL_PAGE_SEGMENTS.some((segment) => pathname.includes(segment))
  );
}
