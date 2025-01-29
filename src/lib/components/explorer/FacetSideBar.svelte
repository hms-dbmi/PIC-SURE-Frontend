<script lang="ts">
  import { Accordion, ProgressRadial } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import { updateFacetsFromSearch } from '$lib/services/dictionary';
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import ErrorAlert from '../ErrorAlert.svelte';
  import type { Facet } from '$lib/models/Search';
  import FacetCategory from './FacetCategory.svelte';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  let { searchTerm, selectedFacets } = SearchStore;

  let facetsPromise: Promise<DictionaryFacetResult[]>;
  let unsubSearchTerm: Unsubscriber;
  let unsubSelectedFacets: Unsubscriber;

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

  onMount(() => {
    unsubSearchTerm = searchTerm.subscribe(() => {
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
    unsubSelectedFacets = selectedFacets.subscribe(() => {
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
  });

  onDestroy(() => {
    unsubSearchTerm && unsubSearchTerm();
    unsubSelectedFacets && unsubSelectedFacets();
  });
</script>

{#await facetsPromise}
  <div class="radial-container">
    <ProgressRadial width="w-10" />
  </div>
{:then newFacets}
  {#if newFacets?.length > 0}
    <Accordion rounded="rounded-container-token">
      {#each newFacets as facetCategory}
        <FacetCategory {facetCategory} />
      {/each}
    </Accordion>
  {:else}
    <Accordion>
      {#each recreateFacetCategories() as facetCategory}
        <FacetCategory {facetCategory} />
      {/each}
    </Accordion>
  {/if}
{:catch}
  <ErrorAlert title="Something went wrong loading your search options." color="secondary">
    <p>Please wait a moment, refresh the page, and try again.</p>
  </ErrorAlert>
{/await}

<style>
  .radial-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
</style>
