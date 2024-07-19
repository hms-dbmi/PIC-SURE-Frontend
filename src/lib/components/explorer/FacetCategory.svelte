<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { AccordionItem } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import type { Facet } from '$lib/models/Search';
  let { updateFacet, selectedFacets } = SearchStore;

  export let facetCategory: DictionaryFacetResult;
  let facets = facetCategory.facets;
  export let numFacetsToShow: number = 5;
  export let shouldShowSearchBar: boolean = facets.length > numFacetsToShow;
  let filterValue: string;
  let moreThanTenFacets = facets.length > numFacetsToShow;
  $: facetsToDisplay =
    (facets || filterValue || moreThanTenFacets || $selectedFacets || facetCategory) &&
    getFacetsToDisplay();
  $: isChecked = (facetToCheck: string) => {
    return $selectedFacets.some((facet: Facet) => {
      return facet.name === facetToCheck;
    });
  };
  $: selectedFacetsChips = $selectedFacets.filter(
    (facet) => facet?.categoryRef?.name === facetCategory?.name,
  );
  const anyFacetNot0 = facets.some((facet) => facet.count > 0);

  function getFacetsToDisplay() {
    let facetsToDisplay = facets;

    $selectedFacets.forEach((facet) => {
      let index = facetsToDisplay.findIndex((f) => f.name === facet.name);
      if (index > -1) {
        facetsToDisplay.splice(index, 1);
      }
    });
    facetsToDisplay.unshift(
      ...$selectedFacets.filter((facet) => facet.category === facetCategory.name),
    );
    if (filterValue) {
      const lowerFilterValue = filterValue.toLowerCase();
      facetsToDisplay = facetsToDisplay.filter(
        (facet) =>
          facet.display.toLowerCase().includes(lowerFilterValue) ||
          facet.name.toLowerCase().includes(lowerFilterValue),
      );
    } else if (moreThanTenFacets) {
      facetsToDisplay = facetsToDisplay.slice(0, numFacetsToShow);
    }
    return facetsToDisplay;
  }
</script>

<AccordionItem class="card" open={anyFacetNot0}>
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
        <label data-testId={`facet-${facet.name}-label`} for={facet.name} class="m-1">
          <input
            type="checkbox"
            class="&[aria-disabled=“true”]:opacity-75"
            id={facet.name}
            name={facet.name}
            value={facet}
            checked={isChecked(facet.name)}
            disabled={facet.count === 0}
            aria-checked={isChecked(facet.name)}
            on:click={() => updateFacet(facet, facetCategory)}
          />
          <span class={facet.count === 0 ? 'opacity-75' : ''}
            >{`${facet.display} (${facet.count})`}</span
          >
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
