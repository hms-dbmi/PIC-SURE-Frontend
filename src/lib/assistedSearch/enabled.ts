import { config } from '$lib/configuration.svelte';

/** Explorer (authorized) and Discover (open access) each have their own switch. */
export function assistedSearchEnabled(discover: boolean): boolean {
  return discover
    ? config.features.enableAssistedSearchDiscover
    : config.features.enableAssistedSearch;
}
