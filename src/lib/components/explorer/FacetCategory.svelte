<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { AccordionItem } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import { hiddenFacets } from '$lib/services/dictionary';
  import FacetItem from './FacetItem.svelte';
  import type { Facet } from '$lib/models/Search';
  let { updateFacets, selectedFacets } = SearchStore;

  export let facetCategory: DictionaryFacetResult;
  export let facets = facetCategory.facets;
  export let numFacetsToShow: number = 5;
  export let shouldShowSearchBar: boolean = facets?.length > numFacetsToShow;

  const anyFacetNot0 = facets?.some((facet) => facet.count > 0);
  let textFilterValue: string;
  let moreThanTenFacets = facets?.length > numFacetsToShow;

  $: facetsToDisplay =
    (facets || textFilterValue || moreThanTenFacets || $selectedFacets || facetCategory) &&
    getFacetsToDisplay();

  $: selectedFacetsChips = $selectedFacets.filter(
    (facet) => facet?.categoryRef?.name === facetCategory?.name,
  );

  function isIndeterminate(facet: Facet): boolean {
    const atLeastOneChildSelected =
      facet.children?.some((child) => $selectedFacets.some((f) => f.name === child.name)) ?? false;
    const isEveryChildSelected = facet.children?.length
      ? facet.children.every((child) => $selectedFacets.some((f) => f.name === child.name))
      : false;
    return atLeastOneChildSelected && !isEveryChildSelected;
  }

  function isParentFullySelected(facetName: string): boolean {
    const result = facets.some((parent) => {
      if (!parent.children || parent?.children?.length === 0) return false;
      return parent.children.every(
        (child) => child.name === facetName || $selectedFacets.some((f) => f.name === child.name),
      );
    });
    return result;
  }

  function getFacetsToDisplay() {
    const hiddenFacetsForCategory = $hiddenFacets[facetCategory.name] || [];
    let facetsToDisplay = facets.filter((f) => !hiddenFacetsForCategory.includes(f.name));

    const selectedFacetsMap = new Map($selectedFacets.map((facet) => [facet.name, facet]));
    const indeterminateFacets = facetsToDisplay.filter(isIndeterminate);
    const indeterminateMap = new Map(indeterminateFacets.map((facet) => [facet.name, facet]));

    const isChildOfIndeterminate = (facetName: string) => {
      return indeterminateFacets.some((parent) =>
        parent.children?.some((child) => child.name === facetName),
      );
    };

    // Remove facets that will be added to the top or are children of fully selected parents
    facetsToDisplay = facetsToDisplay.filter(
      (f) =>
        !selectedFacetsMap.has(f.name) &&
        !isChildOfIndeterminate(f.name) &&
        !indeterminateMap.has(f.name) &&
        !isParentFullySelected(f.name),
    );

    // Add selected facets at the top (excluding children of indeterminate parents and fully selected parents)
    const selectedFacetsForCategory = $selectedFacets.filter(
      (facet) =>
        facet.category === facetCategory.name &&
        !isChildOfIndeterminate(facet.name) &&
        !isParentFullySelected(facet.name),
    );
    selectedFacetsForCategory.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });

    //Add parents with all children selected
    const parentsWithAllChildrenSelected = facets.filter(
      (f) =>
        f.children?.length &&
        f.children.every((child) => $selectedFacets.some((f) => f.name === child.name)),
    );
    parentsWithAllChildrenSelected.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });

    // Add indeterminate facets at the top
    const indeterminateFacetsForCategory = indeterminateFacets.filter(
      (facet) => facet.category === facetCategory.name,
    );
    indeterminateFacetsForCategory.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });

    facetsToDisplay.unshift(
      ...selectedFacetsForCategory,
      ...parentsWithAllChildrenSelected,
      ...indeterminateFacetsForCategory,
    );

    if (textFilterValue) {
      const lowerFilterValue = textFilterValue.toLowerCase();
      facetsToDisplay = facetsToDisplay.filter((facet) => {
        const facetMatches =
          facet.display.toLowerCase().includes(lowerFilterValue) ||
          facet.name.toLowerCase().includes(lowerFilterValue) ||
          facet.description?.toLowerCase().includes(lowerFilterValue);

        const childrenMatch = facet.children?.some(
          (child) =>
            child.display.toLowerCase().includes(lowerFilterValue) ||
            child.name.toLowerCase().includes(lowerFilterValue) ||
            child.description?.toLowerCase().includes(lowerFilterValue),
        );

        return facetMatches || childrenMatch;
      });
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
        <FacetItem {facet} {facetCategory} facetParent={undefined} {textFilterValue} />
      {/each}
      {#if facets?.length > numFacetsToShow && !textFilterValue}
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
        aria-label="Remove Facet"
        on:click={() => updateFacets([facet])}
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
