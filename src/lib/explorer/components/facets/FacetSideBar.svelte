<script lang="ts">
  import CollapsibleGroup from '#lib/ui/CollapsibleGroup.svelte';

  import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
  import { explorerSearch as search } from '#lib/explorer/search.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import FacetCategory from '#lib/explorer/components/facets/FacetCategory.svelte';
  import FacetSidebarPlaceholder from '#lib/explorer/components/facets/FacetSidebarPlaceholder.svelte';

  // With no facet categories in the response, the selected facets are grouped by category.
  const categories: DictionaryFacetResult[] = $derived.by(() => {
    if (search.facetCategories?.length) return search.facetCategories;
    const grouped: DictionaryFacetResult[] = [];
    search.selectedFacets.forEach((facet) => {
      const category = grouped.find((c) => c.name === facet.category);
      if (category) {
        category.facets.push(facet);
      } else {
        grouped.push({
          display: facet.categoryRef?.display || facet.category,
          facets: [facet],
          description: facet.categoryRef?.description || '',
          name: facet.category,
        });
      }
    });
    return grouped;
  });

  function toggleCategories(next: string[]) {
    const prev = search.openFacets;
    const opened = next.filter((v) => !prev.includes(v));
    const closed = prev.filter((v) => !next.includes(v));
    if (opened.length)
      log(createLog('SEARCH', 'facet.category_toggle', { category: opened[0], open: true }));
    if (closed.length)
      log(createLog('SEARCH', 'facet.category_toggle', { category: closed[0], open: false }));
    search.setOpenFacets(next);
  }
</script>

{#if search.facetsFailed}
  <ErrorAlert title="Something went wrong loading your search options." color="secondary">
    Please wait a moment, refresh the page, and try again.
  </ErrorAlert>
{:else if search.facetCategories === undefined}
  <FacetSidebarPlaceholder numCategories={2} fadeEffect />
{:else}
  <CollapsibleGroup multiple value={search.openFacets} onchange={toggleCategories}>
    {#each categories as facetCategory (facetCategory.name)}
      <FacetCategory {facetCategory} />
    {/each}
  </CollapsibleGroup>
{/if}
