/**
 * Whether a route shows the search chrome - the cohort summary panel (ALS-12835) and the
 * search-mode tab bar (ALS-12836). Both render from the /explorer and /discover layouts, so
 * the rule lives here instead of being spelled out in each of them.
 *
 * This is the rule `showSidebar` applies in `(picsure)/+layout.svelte` today, substring
 * matching and all: Export and Distributions keep their own full-page presentation.
 *
 * Total for any string, including '' and paths outside the search section - the layouts are
 * not the only caller, and a pathname that belongs to neither section is simply not chrome.
 */
export function showsSearchChrome(pathname: string): boolean {
  const inSearchSection = pathname.includes('/explorer') || pathname.includes('/discover');
  return inSearchSection && !pathname.includes('/export') && !pathname.includes('/distributions');
}
