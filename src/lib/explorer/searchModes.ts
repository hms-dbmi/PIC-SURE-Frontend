import { config } from '$lib/configuration.svelte';

/**
 * One search mode, which is one tab in the Explore tab bar and one route under the
 * /explorer or /discover layout.
 *
 * The tab set is a registry rather than two hardcoded tabs because Studies and FHIR are
 * coming (see the v1 prototype). Adding one is a single entry here plus a `+page.svelte` -
 * no change to the tab bar or to ALS-12835's empty-state text, which reads the same registry
 * so that it names only the modes the current page actually has.
 */
export type SearchMode = {
  id: string;
  label: string;
  route: string;
  enabled: (isDiscover: boolean) => boolean;
  /** True on the mode's own route and on its detail pages. */
  isActive: (pathname: string) => boolean;
};

/** '/explorer/' and '/explorer' are the same route; `page.url.pathname` can carry either. */
function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function isDiscoverPath(pathname: string): boolean {
  return pathname.includes('/discover');
}

/**
 * Today's search. Its route is the section root - `/explorer`, or `/discover` on Discover -
 * and not `/explorer/phenotypes`, which keeps every existing link, the `configuration.json`
 * sitemap entry and the e2e paths working. The cost is this asymmetric-looking entry.
 *
 * The href only ever points at Explore because Discover enables this mode alone and so
 * renders no tab bar at all. `isActive` still has to answer for both sections: it is also
 * what ALS-12835's panel and any future chrome ask.
 */
export const phenotypesMode: SearchMode = {
  id: 'phenotypes',
  label: 'Phenotypes',
  route: '/explorer',
  enabled: () => true,
  isActive: (pathname) => {
    const path = normalize(pathname);
    return (
      path === '/explorer' ||
      path === '/discover' ||
      // The variable detail page keeps the tab bar with Phenotypes active (ALS-12832 PR 5).
      path.startsWith('/explorer/variable/') ||
      path.startsWith('/discover/variable/')
    );
  },
};

/**
 * Genomic filtering. `enabled` is the one definition of the rule that also gates today's
 * Genomic Filtering button in `Explorer.svelte`; ALS-12880 retires that button and leaves
 * this as the only entry point.
 */
export const genotypesMode: SearchMode = {
  id: 'genotypes',
  label: 'Genotypes',
  route: '/explorer/genotypes',
  enabled: (isDiscover) =>
    (config.features.enableGENEQuery || config.features.enableSNPQuery) && !isDiscover,
  isActive: (pathname) => normalize(pathname) === '/explorer/genotypes',
};

/** The registry, in tab order. */
export const searchModes: SearchMode[] = [phenotypesMode, genotypesMode];

/**
 * The modes the given page offers. One mode means no tab bar: Discover has nothing to switch
 * between, and neither does an Explore deployment with genomic search turned off.
 */
export function enabledSearchModes(pathname: string): SearchMode[] {
  const isDiscover = isDiscoverPath(pathname);
  return searchModes.filter((mode) => mode.enabled(isDiscover));
}
