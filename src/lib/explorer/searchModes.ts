import { config } from '$lib/configuration.svelte';

/**
 * One search mode: one link in the Explore mode bar, and one route under the /explorer or
 * /discover layout.
 */
export type SearchMode = {
  id: string;
  label: string;
  route: string;
  enabled: (isDiscover: boolean) => boolean;
  isActive: (pathname: string) => boolean;
};

export function isDiscoverPath(pathname: string): boolean {
  return pathname.includes('/discover');
}

/**
 * The route is the section root - `/explorer` - and not `/explorer/phenotypes`, so existing
 * links, the `configuration.json` sitemap entries and the e2e paths keep working. Discover
 * enables this mode alone and renders no mode bar, so the route only ever points at Explore;
 * `isActive` still has to answer for both sections.
 */
export const phenotypesMode: SearchMode = {
  id: 'phenotypes',
  label: 'Phenotypes',
  route: '/explorer',
  enabled: () => true,
  isActive: (pathname) => pathname === '/explorer' || pathname === '/discover',
};

/** Genomic filtering. `enabled` gates the mode's link; the route itself is not guarded. */
export const genotypesMode: SearchMode = {
  id: 'genotypes',
  label: 'Genotypes',
  route: '/explorer/genotypes',
  enabled: (isDiscover) =>
    (config.features.enableGENEQuery || config.features.enableSNPQuery) && !isDiscover,
  isActive: (pathname) => pathname === '/explorer/genotypes',
};

/** The registry, in display order. */
export const searchModes: SearchMode[] = [phenotypesMode, genotypesMode];

export function enabledSearchModes(pathname: string): SearchMode[] {
  const isDiscover = isDiscoverPath(pathname);
  return searchModes.filter((mode) => mode.enabled(isDiscover));
}

function joinWithOr(items: string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
}

export function emptyCohortText(modeLabels: string[]): string {
  if (modeLabels.length === 0) return 'No filters yet - add one below';
  const labels = modeLabels.map((label) => label.toLowerCase());
  return `No filters yet - add one from the ${joinWithOr(labels)} page below`;
}

export function emptyCohortTextAt(pathname: string): string {
  return emptyCohortText(enabledSearchModes(pathname).map((mode) => mode.label));
}
