<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';

  import type { Facet } from '$lib/models/Search';
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { selectedFacets } from '$lib/stores/Search';
  import { facetsPromise, openFacets } from '$lib/stores/Dictionary';

  import ErrorAlert from '../ErrorAlert.svelte';
  import FacetCategory from './FacetCategory.svelte';
  import Loading from '../Loading.svelte';

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
  <Loading ring size="medium" />
{:then newFacets}
  {#if newFacets?.length > 0}
    <Accordion multiple value={$openFacets} onValueChange={(e) => ($openFacets = e.value)}>
      {#snippet iconOpen()}<i class="fa-solid fa-angle-up"></i>{/snippet}
      {#snippet iconClosed()}<i class="fa-solid fa-angle-down"></i>{/snippet}
      {#each newFacets as facetCategory}
        <FacetCategory {facetCategory} />
      {/each}
    </Accordion>
  {:else}
    <Accordion multiple value={$openFacets} onValueChange={(e) => ($openFacets = e.value)}>
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
