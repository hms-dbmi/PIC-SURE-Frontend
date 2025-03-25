<script lang="ts">
  import { Accordion, ProgressRadial } from '@skeletonlabs/skeleton';

  import type { Facet } from '$lib/models/Search';
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { selectedFacets } from '$lib/stores/Search';
  import { facetsPromise } from '$lib/stores/Dictionary';

  import ErrorAlert from '../ErrorAlert.svelte';
  import FacetCategory from './FacetCategory.svelte';

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
