import { config } from '$lib/configuration.svelte';

export function assistedSearchEnabled(discover: boolean): boolean {
  return discover
    ? config.features.enableAssistedSearchDiscover
    : config.features.enableAssistedSearch;
}
