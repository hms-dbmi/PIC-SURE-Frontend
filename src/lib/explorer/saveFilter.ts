import type { Filter } from '#lib/query/filter.svelte.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

/**
 * Stores a filter built in the explorer (replacing the filter with uuid `replacing`, if given),
 * fills in its study and table labels unless `enrich` is false, and shows it in the results panel.
 */
export function saveFilter(
  filter: Filter,
  { replacing, enrich = true }: { replacing?: string; enrich?: boolean } = {},
) {
  if (replacing) filterState.update(replacing, filter);
  else filterState.add(filter);
  if (enrich) filterState.enrich(filter, filter.id, filter.dataset);
  explorerPanel.closeRow();
  explorerPanel.show();
}
