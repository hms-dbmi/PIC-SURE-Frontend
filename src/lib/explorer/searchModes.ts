import { config } from '$lib/configuration.svelte';

import { isDiscoverSection, searchRoute } from '$lib/explorer/searchChrome';

/**
 * One search mode, which is one link in the Explore mode bar and one route under the
 * /explorer or /discover layout.
 *
 * The mode set is a registry rather than two hardcoded entries because more modes are
 * planned - Studies and FHIR - and adding one should be a single entry here plus a
 * `+page.svelte`. The mode bar and the cohort panel's empty-state text both read it, so the
 * text names only the modes the current page actually has.
 */
export type SearchMode = {
  id: string;
  label: string;
  /**
   * The label as it appears inside a sentence, for the empty-state text. Defaults to `label`
   * lowercased, which is what ordinary words want and what acronyms must not have: a FHIR
   * mode sets `'FHIR'` here rather than reading "fhir" to the user.
   */
  inlineLabel?: string;
  route: string;
  enabled: (isDiscover: boolean) => boolean;
  /** True on the mode's own route and on its detail pages. */
  isActive: (pathname: string) => boolean;
};

/**
 * Today's search. Its route is the section root - `/explorer`, or `/discover` on Discover -
 * and not `/explorer/phenotypes`, which keeps every existing link, the `configuration.json`
 * sitemap entry and the e2e paths working. The cost is this asymmetric-looking entry.
 *
 * The href only ever points at Explore because Discover enables this mode alone and so
 * renders no mode bar at all. `isActive` still has to answer for both sections: the cohort
 * panel asks it too.
 */
export const phenotypesMode: SearchMode = {
  id: 'phenotypes',
  label: 'Phenotypes',
  route: '/explorer',
  enabled: () => true,
  isActive: (pathname) => {
    const { section, child } = searchRoute(pathname);
    if (!section) return false;
    // The section root, plus the variable detail pages beneath it, which show this mode's
    // own results and so keep it selected.
    return child === undefined || child === 'variable';
  },
};

/**
 * Genomic filtering. `enabled` is the one definition of the rule, shared with the Genomic
 * Filtering button that is the other entry point to the same thing.
 */
export const genotypesMode: SearchMode = {
  id: 'genotypes',
  label: 'Genotypes',
  route: '/explorer/genotypes',
  enabled: (isDiscover) =>
    (config.features.enableGENEQuery || config.features.enableSNPQuery) && !isDiscover,
  isActive: (pathname) => {
    const { section, child } = searchRoute(pathname);
    // Matches the route and anything beneath it, so a future detail page keeps it selected.
    return section === 'explorer' && child === 'genotypes';
  },
};

/** The registry, in display order. */
export const searchModes: SearchMode[] = [phenotypesMode, genotypesMode];

/**
 * The modes the given page offers. One mode means no mode bar: Discover has nothing to
 * switch between, and neither does an Explore deployment with genomic search turned off.
 */
export function enabledSearchModes(pathname: string): SearchMode[] {
  const isDiscover = isDiscoverSection(pathname);
  return searchModes.filter((mode) => mode.enabled(isDiscover));
}

/**
 * The mode's href, carrying the search the user is looking at so that switching modes, Copy
 * Link and middle-click all keep it. `?search=` is authoritative on every navigation, so the
 * term has to travel in the URL or the address bar drops what the results still show.
 */
export function searchModeHref(mode: SearchMode, searchTerm: string): string {
  return searchTerm ? `${mode.route}?search=${encodeURIComponent(searchTerm)}` : mode.route;
}

/** "a", "a or b", "a, b or c" - no serial comma, no dangling "or" on a single item. */
function joinWithOr(items: string[]): string {
  if (items.length < 2) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
}

/** How the mode reads inside a sentence, which for an acronym is not its label lowercased. */
export function inlineModeLabel(mode: SearchMode): string {
  return mode.inlineLabel ?? mode.label.toLowerCase();
}

/**
 * The cohort panel's empty-state text, built from the mode labels rather than written out, so
 * that Studies and FHIR each grow the sentence by one entry in the registry above and no edit
 * here. Exported separately from `emptyCohortTextAt` so the list-building can be tested at
 * mode counts the registry does not have yet.
 *
 * Takes the labels already in their inline form: casing belongs to the mode that owns the
 * word, not to the sentence.
 *
 * The registry makes an empty list unreachable today - the phenotypes mode is enabled
 * unconditionally - but this is user-facing copy, so the empty case is guarded rather than
 * left to that precondition holding as modes are added. Without the guard it reads
 * "from the  page below".
 *
 * "page" stays singular: the reader is going to one page, whichever they pick.
 */
export function emptyCohortText(inlineLabels: string[]): string {
  if (inlineLabels.length === 0) return 'No filters yet - add one below';
  return `No filters yet - add one from the ${joinWithOr(inlineLabels)} page below`;
}

/**
 * The empty-state text for the page at `pathname`, naming only the modes that page offers -
 * so Discover, which has no Genotypes tab, does not send the reader to one.
 */
export function emptyCohortTextAt(pathname: string): string {
  return emptyCohortText(enabledSearchModes(pathname).map(inlineModeLabel));
}
