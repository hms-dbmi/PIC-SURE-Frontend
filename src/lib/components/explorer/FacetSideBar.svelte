<script lang="ts">
  import { Accordion, ProgressRadial } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import { updateFacetsFromSearch } from '$lib/services/dictionary';
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { browser } from '$app/environment';
  import ErrorAlert from '../ErrorAlert.svelte';
  import type { Facet } from '$lib/models/Search';
  import FacetCategory from './FacetCategory.svelte';
  let { searchTerm, selectedFacets } = SearchStore;

  let facetsPromise: Promise<DictionaryFacetResult[]>;
  if (browser) {
    searchTerm.subscribe(() => {
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
    selectedFacets.subscribe(() => {
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
  }

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

<div id="facet-side-bar">
  <h2 class="m-1 -mt-2 text-xl text-center">Refine Search</h2>
  {#await facetsPromise}
    <ProgressRadial />
  {:then newFacets}
    {#if newFacets?.length > 0}
      <Accordion autocollapse rounded="rounded-container-token">
        {#each newFacets as facetCategory, index}
          <FacetCategory {facetCategory} {index} />
        {/each}
      </Accordion>
    {:else}
      <Accordion autocollapse>
        {#each recreateFacetCategories() as facetCategory, index}
          <FacetCategory {facetCategory} {index} />
        {/each}
      </Accordion>
    {/if}
  {:catch}
    <ErrorAlert title="An error occured while retrieving facets." />
  {/await}
</div>

<style>
</style>
