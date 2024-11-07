<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { AccordionItem, RecursiveTreeView, type TreeViewNode } from '@skeletonlabs/skeleton';
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
  let selectedFacetsNames: string[] = $selectedFacets.map((facet) => facet.name);
  let indeterminateNodes: string[] = [];

  $: facetsToDisplay =
    (facets || textFilterValue || moreThanTenFacets || $selectedFacets || facetCategory) &&
    getFacetsToDisplay();

  $: selectedFacetsChips = $selectedFacets.filter(
    (facet) => facet?.categoryRef?.name === facetCategory?.name,
  );

  function getFacetsToDisplay() {
    const hiddenFacetsForCategory = $hiddenFacets[facetCategory.name] || [];
    let facetsToReturn = facets.filter((f) => !hiddenFacetsForCategory.includes(f.name));

    // Find parents of selected children and selected top-level facets
    const selectedFacetsForCategory = $selectedFacets.filter(
      (facet) => facet.category === facetCategory.name
    );
    
    const parentsToPromote = new Set<string>();
    // Reset indeterminate nodes
    indeterminateNodes = [];
    
    selectedFacetsForCategory.forEach((selectedFacet) => {
      // Update counts for selected facets
      selectedFacet.count = facets.find((f) => f.name === selectedFacet.name)?.count || 0;
      
      // If this is a child facet, mark its parent for promotion and indeterminate state
      if (selectedFacet.parentRef?.name) {
        parentsToPromote.add(selectedFacet.parentRef.name);
        if (!indeterminateNodes.includes(selectedFacet.parentRef.name)) {
          indeterminateNodes = [...indeterminateNodes, selectedFacet.parentRef.name];
        }
      }
    });

    // Separate facets into promoted and non-promoted
    const promotedFacets: Facet[] = [];
    const remainingFacets: Facet[] = [];

    facetsToReturn.forEach((facet) => {
      if (parentsToPromote.has(facet.name) || 
          selectedFacetsForCategory.some(sf => sf.name === facet.name && !sf.parentRef)) {
        promotedFacets.push(facet);
      } else {
        remainingFacets.push(facet);
      }
    });

    // Combine the arrays with promoted facets first
    facetsToReturn = [...promotedFacets, ...remainingFacets];

    if (textFilterValue) {
      //Filter Facets by searched text
      const lowerFilterValue = textFilterValue.toLowerCase();
      facetsToReturn = facetsToReturn.filter(
        (facet) =>
          facet.display.toLowerCase().includes(lowerFilterValue) ||
          facet.name.toLowerCase().includes(lowerFilterValue) ||
          facet.description?.toLowerCase().includes(lowerFilterValue)
      );
    } else if (moreThanTenFacets) {
      // Only show the first n facets
      facetsToReturn = facetsToReturn.slice(0, numFacetsToShow);
    }
    return facetsToReturn;
  }

  function convertFacetsToTreeViewNode(facets: Facet[]): TreeViewNode[] {
    let treeViewNodes: TreeViewNode[] = [];
    for (const facet of facets) {
      treeViewNodes.push({
        id: facet.name,
        content: `${facet.display} (${facet.count})`,
        contentProps: {
          spacing: 'space-x-2',
        },
        children: facet.children ? convertFacetsToTreeViewNode(facet.children) : undefined,
      });
    }
    return treeViewNodes;
  }

  $: if (selectedFacetsNames) {
    const currentSelectedNames = new Set($selectedFacets.map((f) => f.name));
    const newSelectedNames = new Set(selectedFacetsNames);

    for (const facetName of [...currentSelectedNames, ...newSelectedNames]) {
      if (currentSelectedNames.has(facetName) !== newSelectedNames.has(facetName)) {
        const findFacet = (facets: Facet[]): { facet: Facet, parent?: Facet } | undefined => {
          for (const f of facets) {
            if (f.name === facetName) return { facet: f };
            if (f.children) {
              const childFacet = f.children.find((child) => child.name === facetName);
              if (childFacet) return { facet: childFacet, parent: f };
            }
          }
          return undefined;
        };

        const result = findFacet(facets);
        if (result) {
          const { facet, parent } = result;
          updateFacet(
            {
              name: facet.name,
              display: facet.display,
              count: facet.count,
              category: facetCategory.name,
              description: facet.description,
            },
            facetCategory,
            parent
              ? {
                  name: parent.name,
                  category: facetCategory.name,
                  categoryRef: facetCategory,
            }
            : undefined,
          );
        }
      }
    }
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
      <RecursiveTreeView
        selection
        multiple
        relational
        padding="p-2"
        indent="pl-1"
        hover=""
        nodes={convertFacetsToTreeViewNode(facetsToDisplay)}
        bind:checkedNodes={selectedFacetsNames}
        bind:indeterminateNodes
      />
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
  .tree-item-content {
    cursor: default !important;
  }
  .show-more {
    @apply btn btn-sm variant-outline rounded-container-token;
  }
</style>
