<script lang="ts">
  import CollapsibleGroup from '#lib/ui/CollapsibleGroup.svelte';

  import type { Facet } from '#lib/explorer/types.ts';
  import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
  import { selectedFacets } from '#lib/explorer/Search.ts';
  import { facetsPromise, openFacets } from '#lib/explorer/Dictionary.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import FacetCategory from '#lib/explorer/components/facets/FacetCategory.svelte';
  import FacetSidebarPlaceholder from '#lib/explorer/components/facets/FacetSidebarPlaceholder.svelte';
  import type { PreviousCategoriesForPlaceholder } from '#lib/explorer/types.ts';

  let previousCategories = $state([] as PreviousCategoriesForPlaceholder[]);

  $effect(() => {
    $facetsPromise?.then(
      (newFacets) => {
        if (newFacets?.length > 0) {
          previousCategories = newFacets.map((category) => ({
            numFacets: category.facets.length,
            showSearchAndButton: category.facets.length > 5,
          }));
        }
      },
      () => {},
    );
  });

  function recreateFacetCategories(): DictionaryFacetResult[] {
    let facetsToShow: DictionaryFacetResult[] = [];
    $selectedFacets.forEach((facet: Facet) => {
      let facetCategory = facetsToShow.find((category) => category.display === facet.category);
      if (facetCategory) {
        facetCategory.facets.push(facet);
      } else {
        facetsToShow.push({
          display: facet?.categoryRef?.display || facet.category,
          facets: [facet],
          description: facet?.categoryRef?.description || '',
          name: facet.category,
        });
      }
    });
    return facetsToShow;
  }

  function toggleCategories(next: string[]) {
    const prev = $openFacets;
    const opened = next.filter((v) => !prev.includes(v));
    const closed = prev.filter((v) => !next.includes(v));
    if (opened.length)
      log(createLog('SEARCH', 'facet.category_toggle', { category: opened[0], open: true }));
    if (closed.length)
      log(createLog('SEARCH', 'facet.category_toggle', { category: closed[0], open: false }));
    $openFacets = next;
  }
</script>

{#await $facetsPromise}
  <FacetSidebarPlaceholder
    numCategories={2}
    fadeEffect
    previousCategories={previousCategories.length > 0 ? previousCategories : []}
  />
{:then newFacets}
  <CollapsibleGroup multiple value={$openFacets} onchange={toggleCategories}>
    {#each newFacets?.length > 0 ? newFacets : recreateFacetCategories() as facetCategory}
      <FacetCategory {facetCategory} />
    {/each}
  </CollapsibleGroup>
{:catch}
  <ErrorAlert title="Something went wrong loading your search options." color="secondary">
    Please wait a moment, refresh the page, and try again.
  </ErrorAlert>
{/await}
