import { untrack } from 'svelte';

import { config } from '#lib/config/config.svelte.ts';
import { genomicToClauses, treeToClause } from '#lib/query/build.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import { parseQuery } from '#lib/query/query.ts';
import { loadQuerySummaryData } from '#lib/query/restore.ts';
import { getConceptTree } from '#lib/api/picsure/dictionary.ts';
import { explorerSearch } from '#lib/explorer/search.svelte.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
import {
  ENSURE_MAX_DEPTH,
  exportState,
  getConceptDetails,
  mapSearchResultAsExport,
} from '#lib/explorer/index.ts';

import { resolveFacets, toSlimFacets } from './model/facets.ts';
import { hasNegation } from './model/screen.ts';
import type { ChatQuery, ScreenPart, ScreenState } from './model/types.ts';

/** The researcher's screen as the AI service sees it: filters become a query, facets are slimmed. */
export function readScreen(): ScreenState {
  return {
    query: {
      select: exportState.variables.map((e) => e.conceptPath),
      phenotypicClause: treeToClause(filterState.tree),
      genomicFilters: genomicToClauses(filterState.genomic),
    },
    facets: toSlimFacets(explorerSearch.selectedFacets),
    search: explorerSearch.term,
  };
}

// Built before anything is set, so a concept that cannot be looked up leaves the screen untouched.
async function queryToState(query: ChatQuery) {
  // The filters cannot hold a negated clause, so restoring one would reverse it. Refuse it whole.
  if (hasNegation(query))
    throw new Error('The assistant sent a negated clause, which is not supported');
  const data = loadQuerySummaryData(parseQuery(query), {
    getConceptDetails,
    getConceptTree: (dataset, conceptPath) =>
      getConceptTree(dataset, ENSURE_MAX_DEPTH, conceptPath),
    bypassConceptLookup: config.settings.dataset.bypassConceptLookup,
  });
  const [tree, genomic, selected, errors] = await Promise.all([
    data.filterTree,
    data.genomicFilters,
    data.exports,
    data.errors,
  ]);
  if (errors.length) throw new Error(`Could not load: ${errors.join(', ')}`);
  return () => {
    filterState.restore(tree, genomic);
    exportState.replace(selected.map(mapSearchResultAsExport));
    // Filters added by hand open the results panel, and so do the assistant's.
    if (filterState.all.length !== 0) explorerPanel.show();
  };
}

/**
 * Sets each part present in `parts`, whole. The search store re-runs the search on its own.
 * Everything is prepared first, and `stillWanted` is asked once more just before the first write,
 * since the lookup is slow enough for a reset or an edit to land meanwhile; when it says no,
 * nothing is written. A failure part-way carries the parts already set, as `committed`.
 */
export async function applyScreen(
  parts: Partial<ScreenState>,
  stillWanted: () => boolean = () => true,
): Promise<void> {
  const setQuery = parts.query ? await queryToState(parts.query) : undefined;
  const facets = parts.facets
    ? resolveFacets(parts.facets, explorerSearch.facetCategories ?? [])
    : undefined;
  if (!stillWanted()) return;

  const committed: ScreenPart[] = [];
  try {
    if (setQuery) {
      setQuery();
      committed.push('query');
    }
    if (facets) {
      explorerSearch.setFacets(facets);
      committed.push('facets');
    }
    if (parts.search !== undefined) {
      explorerSearch.setTerm(parts.search);
      committed.push('search');
    }
  } catch (e) {
    throw Object.assign(e instanceof Error ? e : new Error(String(e)), { committed });
  }
}

/** Calls `onchange` whenever something behind the screen changes; returns the stop. */
export function watchScreen(onchange: () => void): () => void {
  return $effect.root(() => {
    let first = true;
    $effect(() => {
      // Reading the whole screen tracks every part of it, including edits inside a filter.
      readScreen();
      // the first run reports the current screen, which is not a change
      if (first) first = false;
      else untrack(onchange);
    });
  });
}
