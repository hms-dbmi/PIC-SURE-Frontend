<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { AccordionItem } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import type { Facet } from '$lib/models/Search';
  let { updateFacet, selectedFacets } = SearchStore;

  export let facetCategory: DictionaryFacetResult;
  let facets = facetCategory.facets;
  export let numFacetsToShow: number = 5;
  export let shouldShowSearchBar: boolean = facets.length > 3;
  let filterValue: string;
  let moreThanTenFacets = facets.length > numFacetsToShow;
  $: facetsToDisplay = (facets || filterValue || moreThanTenFacets) && getFacetsToDisplay();
  $: isChecked = (facetToCheck: string) =>
    $selectedFacets.some((facet: Facet) => {
      return facet.name === facetToCheck;
    });
  $: selectedFacetsChips = $selectedFacets.filter(
    (facet) => facet?.categoryRef?.name === facetCategory?.name,
  );

  function getFacetsToDisplay() {
    if (!filterValue) {
      return moreThanTenFacets ? facets.slice(0, numFacetsToShow) : facets;
    } else {
      return facets.filter((facet) =>
        facet.display.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }
  }
</script>

<AccordionItem class="card" open>
  <svelte:fragment slot="summary">{facetCategory.display}</svelte:fragment>
  <svelte:fragment slot="content">
    {#if shouldShowSearchBar}
      <input
        class="p-1"
        type="search"
        placeholder={'Filter ' + facetCategory.display}
        name="facet-fitler"
        id={facetCategory.name + '-filter'}
        bind:value={filterValue}
      />
    {/if}
    <div class="flex flex-col">
      {#each facetsToDisplay as facet}
        <label for={facet.name} class="m-1">
          <input
            type="checkbox"
            id={facet.name}
            name={facet.name}
            value={facet}
            checked={isChecked(facet.name)}
            aria-checked={isChecked(facet.name)}
            on:click={() => updateFacet(facet, facetCategory)}
          />
          <span>{`${facet.display} (${facet.count})`}</span>
        </label>
      {/each}
      {#if facets.length > numFacetsToShow && !filterValue}
        <button
          data-testId="show-more-facets"
          class="show-more w-fit mx-auto my-1"
          on:click={() => (moreThanTenFacets = !moreThanTenFacets)}
        >
          {moreThanTenFacets ? 'Show More' : 'Show Less'}
          <i class="ml-1 fa-solid {moreThanTenFacets ? 'fa-angle-down' : 'fa-angle-up'}"></i>
        </button>
      {/if}
    </div>
  </svelte:fragment>
</AccordionItem>
<div class="m-1 p-1">
  {#each selectedFacetsChips as facet}
    <span class="badge variant-ringed-primary m-1 p-2" id={facet.name}>
      {facet.display}
      <button class="chip-close ml-1" on:click={() => updateFacet(facet, facetCategory)}>
        <i class="fa-solid fa-times hover:text-secondary-500"></i>
      </button>
    </span>
  {/each}
</div>

<style lang="postcss">
  .show-more {
    @apply btn btn-sm variant-outline rounded-container-token;
  }
</style>
