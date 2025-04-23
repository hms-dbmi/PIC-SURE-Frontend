<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import type { Facet } from '$lib/models/Search';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import SearchStore from '$lib/stores/Search';
  import { hiddenFacets } from '$lib/stores/Dictionary';
  import FacetItem from './FacetItem.svelte';
  let { updateFacets, selectedFacets } = SearchStore;

  interface Props {
    facetCategory: DictionaryFacetResult;
    facets?: Facet[];
    numFacetsToShow?: number;
  }

  let {
    facetCategory,
    facets = facetCategory.facets,
    numFacetsToShow = 5,
  }: Props = $props();

  let filteredHiddenFacets = $state(facets.filter((f) => !($hiddenFacets[facetCategory.name] || []).includes(f.name)));
  let textFilterValue: string = $state('');

  let anyFacetNot0 = $derived(filteredHiddenFacets?.some((facet) => facet.count > 0));
  let shouldShowSearchBar: boolean = $derived(filteredHiddenFacets?.length > numFacetsToShow);
  let moreThanNumFacetsToShow = $derived(filteredHiddenFacets?.length > numFacetsToShow);
  let facetsToDisplay = $derived(
    (facets || textFilterValue || moreThanNumFacetsToShow || $selectedFacets || facetCategory) &&
    getFacetsToDisplay()
  );
  let selectedFacetsChips = $derived(
    $selectedFacets.filter((facet) => facet?.categoryRef?.name === facetCategory?.name)
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
    let facetsToDisplay = filteredHiddenFacets;

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
    } else if (moreThanNumFacetsToShow) {
      // Only show the first n facets
      facetsToDisplay = facetsToDisplay.slice(0, numFacetsToShow);
    }
    return facetsToDisplay;
  }
</script>

<Accordion.Item class="card space-y-2" open={anyFacetNot0}>
  {#snippet summary()}
    {facetCategory.display}
  {/snippet}
  {#snippet content()}
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
        <FacetItem {facet} {facetCategory} {textFilterValue} />
      {/each}
      {#if filteredHiddenFacets?.length > numFacetsToShow && !textFilterValue}
        <button
          data-testId="show-more-facets"
          class="show-more w-fit mx-auto my-1"
          onclick={() => (moreThanNumFacetsToShow = !moreThanNumFacetsToShow)}
        >
          {moreThanNumFacetsToShow ? 'Show More' : 'Show Less'}
          <i class="ml-1 fa-solid {moreThanNumFacetsToShow ? 'fa-angle-down' : 'fa-angle-up'}"></i>
        </button>
      {/if}
    </div>
  {/snippet}
</Accordion.Item>
<div class="m-1 p-1 max-w">
  {#each selectedFacetsChips as facet}
    <span
      class="badge relative z-10 preset-outlined-primary-500 m-1 p-2 flex items-center box-border w-full max-w-full overflow-hidden"
      id={facet.name}
    >
      <span class="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
        {facet.display}
      </span>
      <button
        class="chip-close ml-1 shrink-0"
        aria-label="Remove Facet"
        onclick={() => updateFacets([facet])}
      >
        <i class="fa-solid fa-times hover:text-secondary-500"></i>
      </button>
    </span>
  {/each}
</div>

<style lang="postcss">
  .show-more {
    @reference btn btn-sm variant-outline rounded-container-token;
  }
</style>
