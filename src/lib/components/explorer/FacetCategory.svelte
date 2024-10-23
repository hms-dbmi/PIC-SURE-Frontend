<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { AccordionItem } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import type { Facet } from '$lib/models/Search';
  import { hiddenFacets } from '$lib/services/dictionary';
  let { updateFacet, selectedFacets } = SearchStore;

  export let facetCategory: DictionaryFacetResult;
  export let facets = facetCategory.facets;
  export let numFacetsToShow: number = 5;
  export let shouldShowSearchBar: boolean = facets.length > numFacetsToShow;

  const anyFacetNot0 = facets.some((facet) => facet.count > 0);
  let textFilterValue: string;
  let moreThanTenFacets = facets.length > numFacetsToShow;

  $: facetsToDisplay =
    (facets || textFilterValue || moreThanTenFacets || $selectedFacets || facetCategory) &&
    getFacetsToDisplay();

  $: selectedFacetsChips = $selectedFacets.filter(
    (facet) => facet?.categoryRef?.name === facetCategory?.name,
  );

  $: isChecked = (facetToCheck: string) => {
    return $selectedFacets.some((facet: Facet) => {
      return facet.name === facetToCheck;
    });
  };

  function getFacetsToDisplay() {
    const hiddenFacetsForCategory = $hiddenFacets[facetCategory.name];
    let facetsToDisplay = facets.filter((f) => !hiddenFacetsForCategory.includes(f.name));

    //Put selected facets at the top
    const selectedFacetsMap = new Map($selectedFacets.map((facet) => [facet.name, facet]));
    facetsToDisplay = facetsToDisplay.filter((f) => !selectedFacetsMap.has(f.name));

    const selectedFacetsForCategory = $selectedFacets.filter(
      (facet) => facet.category === facetCategory.name,
    );
    selectedFacetsForCategory.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });

    facetsToDisplay.unshift(...selectedFacetsForCategory);
    if (textFilterValue) {
      //Filter Facets by searched text
      const lowerFilterValue = textFilterValue.toLowerCase();
      facetsToDisplay = facetsToDisplay.filter(
        (facet) =>
          facet.display.toLowerCase().includes(lowerFilterValue) ||
          facet.name.toLowerCase().includes(lowerFilterValue) ||
          facet.description?.toLowerCase().includes(lowerFilterValue),
      );
    } else if (moreThanTenFacets) {
      // Only show the first n facets
      facetsToDisplay = facetsToDisplay.slice(0, numFacetsToShow);
    }
    return facetsToDisplay;
  }
</script>

<AccordionItem class="card space-y-2" open={anyFacetNot0}>
  <svelte:fragment slot="summary">{facetCategory.display}</svelte:fragment>
  <svelte:fragment slot="content">
    <div class="flex flex-col">
      {#if shouldShowSearchBar}
        <input
          class="text-sm"
          type="search"
          placeholder={'Filter ' + facetCategory.display}
          name="facet-fitler"
          id={facetCategory.name + '-filter'}
          bind:value={textFilterValue}
        />
      {/if}
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
          <span class:opacity-75={facet.count === 0}
            >{`${facet.display} (${facet.count?.toLocaleString()})`}</span
          >
        </label>
      {/each}
      {#if facets.length > numFacetsToShow && !textFilterValue}
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
<div class="m-1 p-1 max-w">
  {#each selectedFacetsChips as facet}
    <span
      class="badge relative z-10 variant-ringed-primary m-1 p-2 flex items-center box-border w-full max-w-full overflow-hidden"
      id={facet.name}
    >
      <span class="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
        {facet.display}
      </span>
      <button
        class="chip-close ml-1 flex-shrink-0"
        on:click={() => updateFacet(facet, facetCategory)}
      >
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
