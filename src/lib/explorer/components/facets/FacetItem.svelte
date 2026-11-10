<script lang="ts">
  import FacetItem from './FacetItem.svelte';
  import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
  import type { Facet } from '#lib/explorer/types.ts';
  import SearchStore from '#lib/explorer/Search.ts';
  import {
    expandedNestedFacets,
    nestedFacetKey,
    toggleNestedFacet,
  } from '#lib/explorer/NestedFacets.ts';
  let { updateFacets, selectedFacets } = SearchStore;

  interface Props {
    facet: Facet;
    facetCategory: DictionaryFacetResult;
    textFilterValue: string | undefined;
  }

  let { facet, facetCategory, textFilterValue }: Props = $props();

  let expansionKey = $derived(nestedFacetKey(facetCategory.name, facet.name));
  let open = $derived($expandedNestedFacets.includes(expansionKey));

  function getCurrentlySelectedChildren() {
    return (
      facet.children?.filter((child) => $selectedFacets.some((f) => f.name === child.name)) ?? []
    );
  }

  function onClick(event: MouseEvent) {
    if (facet?.children && facet?.children?.length > 0) {
      if (checkedState(facet.name) === 'indeterminate') {
        // Clearing children leaves checked false, so cancel the browser's toggle to true.
        event.preventDefault();
        updateFacets(getCurrentlySelectedChildren());
      } else {
        updateFacets(facet.children);
      }
    } else {
      updateFacets([facet]);
    }
  }

  let checkedState = $derived((facetToCheck: string) => {
    const atLeastOneChildSelected =
      facet.children &&
      facet.children.some((child) => $selectedFacets.some((f) => f.name === child.name));
    let isEveryChildSelected = false;
    if (atLeastOneChildSelected) {
      isEveryChildSelected =
        facet.children?.every((child) => $selectedFacets.some((f) => f.name === child.name)) ??
        false;
    }
    const isIndeterminate = atLeastOneChildSelected && !isEveryChildSelected;
    const isSelected =
      $selectedFacets.some((facet) => facet.name === facetToCheck) || isEveryChildSelected;

    if (isSelected) return 'true';
    if (isIndeterminate) return 'indeterminate';
    return 'false';
  });

  let checked = $derived(checkedState(facet.name) === 'true');
  let facetsToDisplay = $derived(
    facet.children
      ? [
          ...facet.children
            .filter((child) => {
              const matchesFilter =
                !textFilterValue ||
                child.display.toLowerCase().includes(textFilterValue.toLowerCase()) ||
                child.name.toLowerCase().includes(textFilterValue.toLowerCase()) ||
                child.description?.toLowerCase().includes(textFilterValue.toLowerCase());
              return matchesFilter && $selectedFacets.some((f) => f.name === child.name);
            })
            .sort((a, b) => (b.count || 0) - (a.count || 0)),
          ...facet.children
            .filter((child) => {
              const matchesFilter =
                !textFilterValue ||
                child.display.toLowerCase().includes(textFilterValue.toLowerCase()) ||
                child.name.toLowerCase().includes(textFilterValue.toLowerCase()) ||
                child.description?.toLowerCase().includes(textFilterValue.toLowerCase());
              return matchesFilter && !$selectedFacets.some((f) => f.name === child.name);
            })
            .sort((a, b) => (b.count || 0) - (a.count || 0)),
        ]
      : [],
  );
  const uid = $props.id();
</script>

<label
  data-testId={`explorer-facet-label-${facet.name}`}
  for="{uid}-checkbox"
  class="flex gap-1 m-1 leading-[normal]"
>
  {#if facet?.children !== undefined && facet?.children?.length > 0}
    <button
      type="button"
      class="arrow-button"
      aria-label="{open ? 'Collapse' : 'Expand'} {facet.display} children"
      aria-expanded={open}
      data-testId={`explorer-facet-toggle-${facet.name}`}
      onclick={() => toggleNestedFacet(expansionKey)}
    >
      <i class="fa-solid {open ? 'fa-angle-down' : 'fa-angle-right'}"></i>
    </button>
  {/if}
  <input
    type="checkbox"
    id="{uid}-checkbox"
    class={checkedState(facet.name)}
    name={facet.name}
    value={facet}
    {checked}
    disabled={facet.count === 0 && !checked}
    aria-checked={checked}
    onclick={onClick}
  />
  <span class:opacity-75={facet.count === 0} class="wrap-anywhere"
    >{`${facet.display} (${facet.count?.toLocaleString()})`}</span
  >
</label>
{#if open && facetsToDisplay !== undefined && facetsToDisplay?.length > 0}
  <div class="flex flex-col ml-8" data-testId={`explorer-facet-children-${facet.name}`}>
    {#each facetsToDisplay as child (child.name)}
      <FacetItem facet={child} {facetCategory} {textFilterValue} />
    {/each}
  </div>
{/if}

<style lang="postcss">
  input.indeterminate {
    background-image: url('../../../assets/dash.svg');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-color: var(--color-primary-500);
  }

  .arrow-button {
    background-color: transparent;
  }
</style>
