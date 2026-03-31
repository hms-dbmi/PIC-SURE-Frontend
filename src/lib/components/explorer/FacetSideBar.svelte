<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';

  import type { Facet } from '$lib/models/Search';
  import type { DictionaryFacetResult } from '$lib/models/api/Dictionary';
  import { selectedFacets } from '$lib/stores/Search';
  import { facetsPromise, openFacets } from '$lib/stores/Dictionary';
  import { log, createLog } from '$lib/logger';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import FacetCategory from '$lib/components/explorer/FacetCategory.svelte';
  import FacetSidebarPlaceholder from '$lib/components/explorer/FacetSidebarPlaceholder.svelte';
  import type { PreviousCategoriesForPlaceholder } from '$lib/models/Search';

  let previousCategories = $state([] as PreviousCategoriesForPlaceholder[]);

  $effect(() => {
    $facetsPromise?.then((newFacets) => {
      if (newFacets?.length > 0) {
        previousCategories = newFacets.map((category) => ({
          numFacets: category.facets.length,
          showSearchAndButton: category.facets.length > 5,
        }));
      }
    });
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
</script>

{#await $facetsPromise}
  <FacetSidebarPlaceholder
    numCategories={2}
    fadeEffect
    previousCategories={previousCategories.length > 0 ? previousCategories : []}
  />
{:then newFacets}
  {#if newFacets?.length > 0}
    <Accordion
      multiple
      value={$openFacets}
      onValueChange={(e) => {
        const prev = $openFacets;
        const next = e.value;
        const opened = next.filter((v: string) => !prev.includes(v));
        const closed = prev.filter((v: string) => !next.includes(v));
        if (opened.length)
          log(createLog('SEARCH', 'facet.category_toggle', { category: opened[0], open: true }));
        if (closed.length)
          log(createLog('SEARCH', 'facet.category_toggle', { category: closed[0], open: false }));
        $openFacets = next;
      }}
    >
      {#snippet iconOpen()}<i class="fa-solid fa-angle-up"></i>{/snippet}
      {#snippet iconClosed()}<i class="fa-solid fa-angle-down"></i>{/snippet}
      {#each newFacets as facetCategory}
        <FacetCategory {facetCategory} />
      {/each}
    </Accordion>
  {:else}
    <Accordion
      multiple
      value={$openFacets}
      onValueChange={(e) => {
        const prev = $openFacets;
        const next = e.value;
        const opened = next.filter((v: string) => !prev.includes(v));
        const closed = prev.filter((v: string) => !next.includes(v));
        if (opened.length)
          log(createLog('SEARCH', 'facet.category_toggle', { category: opened[0], open: true }));
        if (closed.length)
          log(createLog('SEARCH', 'facet.category_toggle', { category: closed[0], open: false }));
        $openFacets = next;
      }}
    >
      {#snippet iconOpen()}<i class="fa-solid fa-angle-up"></i>{/snippet}
      {#snippet iconClosed()}<i class="fa-solid fa-angle-down"></i>{/snippet}
      {#each recreateFacetCategories() as facetCategory}
        <FacetCategory {facetCategory} />
      {/each}
    </Accordion>
  {/if}
{:catch}
  <ErrorAlert title="Something went wrong loading your search options." color="secondary">
    Please wait a moment, refresh the page, and try again.
  </ErrorAlert>
{/await}
