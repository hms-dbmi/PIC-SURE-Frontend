import { config } from '#lib/config/config.svelte.ts';

export function assistedSearchEnabled(discover: boolean): boolean {
  return discover
    ? config.features.enableAssistedSearchDiscover
    : config.features.enableAssistedSearch;
}
