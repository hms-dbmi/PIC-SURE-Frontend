<script lang="ts">
  import CollapsiblePanel from '#lib/ui/CollapsiblePanel.svelte';
  import { scale } from 'svelte/transition';
  import { elasticInOut } from 'svelte/easing';
  import type { DictionaryFacetResult, Facet } from '#lib/api/picsure/dictionary.types.ts';
  import { explorerSearch as search } from '#lib/explorer/search.svelte.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  import ShowMoreButton from '#lib/ui/ShowMoreButton.svelte';
  import FacetItem from './FacetItem.svelte';
  import { tones } from '#lib/ui/surface.ts';

  interface Props {
    facetCategory: DictionaryFacetResult;
    facets?: Facet[];
    numFacetsToShow?: number;
  }

  let { facetCategory, facets = facetCategory.facets, numFacetsToShow = 5 }: Props = $props();

  let textFilterValue: string = $state('');
  let showMore: boolean = $state(false);

  let filteredHiddenFacets = $derived(
    facets.filter((f) => !(search.hiddenFacets[facetCategory.name] || []).includes(f.name)),
  );
  let overShowLimit = $derived(filteredHiddenFacets.length > numFacetsToShow);

  let facetsToDisplay = $derived.by(getFacetsToDisplay);
  let selectedFacetsChips = $derived(
    search.selectedFacets.filter((facet) => facet?.categoryRef?.name === facetCategory?.name),
  );

  function isIndeterminate(facet: Facet): boolean {
    const atLeastOneChildSelected =
      facet.children?.some((child) => search.selectedFacets.some((f) => f.name === child.name)) ??
      false;
    const isEveryChildSelected = facet.children?.length
      ? facet.children.every((child) => search.selectedFacets.some((f) => f.name === child.name))
      : false;
    return atLeastOneChildSelected && !isEveryChildSelected;
  }

  function isParentFullySelected(facetName: string): boolean {
    const result = facets.some((parent) => {
      if (!parent.children || parent?.children?.length === 0) return false;
      return parent.children.every(
        (child) =>
          child.name === facetName || search.selectedFacets.some((f) => f.name === child.name),
      );
    });
    return result;
  }

  function getFacetsToDisplay() {
    let facetsToDisplay = [...filteredHiddenFacets];

    const selectedFacetsMap = new Map(search.selectedFacets.map((facet) => [facet.name, facet]));
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
    const selectedFacetsForCategory = search.selectedFacets.filter(
      (facet) =>
        facet.category === facetCategory.name &&
        !isChildOfIndeterminate(facet.name) &&
        !isParentFullySelected(facet.name),
    );

    //Add parents with all children selected
    const parentsWithAllChildrenSelected = facets.filter(
      (f) =>
        f.children?.length &&
        f.children.every((child) => search.selectedFacets.some((f) => f.name === child.name)),
    );

    // Add indeterminate facets at the top
    const indeterminateFacetsForCategory = indeterminateFacets.filter(
      (facet) => facet.category === facetCategory.name,
    );

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
    } else if (!showMore) {
      // Only show the first n facets
      facetsToDisplay = facetsToDisplay.slice(0, numFacetsToShow);
    }
    return facetsToDisplay;
  }
</script>

<CollapsiblePanel value={facetCategory.name}>
  {#snippet heading()}
    {facetCategory.display}
  {/snippet}
  <div class="flex flex-col">
    <!-- A filter that outlives a refetch stays visible, so it can always be cleared. -->
    {#if overShowLimit || textFilterValue}
      <input
        type="search"
        placeholder={'Filter ' + facetCategory.display}
        name="facet-fitler"
        bind:value={textFilterValue}
        onblur={() => {
          if (textFilterValue)
            log(
              createLog('SEARCH', 'facet.search', {
                category: facetCategory.name,
                term: textFilterValue,
                pageContext: getPageContext(),
              }),
            );
        }}
      />
    {/if}
    {#each facetsToDisplay as facet (facet.name)}
      <FacetItem {facet} {facetCategory} {textFilterValue} />
    {/each}
    {#if overShowLimit && !textFilterValue}
      <ShowMoreButton
        data-testid="explorer-facets-show-more"
        expanded={showMore}
        onclick={() => (showMore = !showMore)}
      />
    {/if}
  </div>
</CollapsiblePanel>
{#if !search.openFacets.includes(facetCategory.name)}
  <div class="mb-2 flex flex-wrap gap-2" transition:scale={{ easing: elasticInOut }}>
    {#each selectedFacetsChips as facet (facet.name)}
      <span
        class="badge z-10 {tones['outlined-surface']} py-2 overflow-hidden"
        data-testid="explorer-facet-badge-{facet.name}"
      >
        <span class="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
          {facet.display}
        </span>
        <button
          class="chip-close ml-1 shrink-0"
          aria-label="Remove Facet"
          onclick={() => search.toggleFacets([facet])}
        >
          <i class="fa-solid fa-times hover:text-secondary-500"></i>
        </button>
      </span>
    {/each}
  </div>
{/if}
