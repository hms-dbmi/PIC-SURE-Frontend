<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import type { Facet } from '$lib/models/Search';
  import SearchStore from '$lib/stores/Search';
  let { updateFacets, selectedFacets } = SearchStore;

  export let facet: Facet;
  export let facetCategory: DictionaryFacetResult;
  export let facetParent: Facet | undefined;
  export let textFilterValue: string | undefined;

  if (facetParent) {
    facet.parentRef = {
      name: facetParent.name,
      display: facetParent.display,
      description: facetParent.description,
    };
  }

  if (facetCategory) {
    facet.categoryRef = {
      name: facetCategory.name,
      display: facetCategory.display,
      description: facetCategory.description,
    };
  }

  let open = false;

  function toggleOpen() {
    open = !open;
  }

  function getCurrentlySelectedChildren() {
    return (
      facet.children?.filter((child) => $selectedFacets.some((f) => f.name === child.name)) ?? []
    );
  }

  function onClick() {
    if (facet?.children && facet?.children?.length > 0) {
      if (checkedState(facet.name) === 'indeterminate') {
        updateFacets(getCurrentlySelectedChildren());
      } else {
        updateFacets(facet.children);
      }
    } else {
      updateFacets([facet]);
    }
  }

  $: checkedState = (facetToCheck: string) => {
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
  };

  $: checked = checkedState(facet.name) === 'true';
  $: facetsToDisplay = facet.children
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
    : [];
</script>

<label data-testId={`facet-${facet.name}-label`} for={facet.name} class="m-1">
  {#if facet?.children !== undefined && facet?.children?.length > 0}
    <button
      type="button"
      class="arrow-button"
      data-testId={`facet-${facet.name}-arrow`}
      on:click={toggleOpen}
    >
      <i class="fa-solid {open ? 'fa-angle-down' : 'fa-angle-right'}"></i>
    </button>
  {/if}
  <input
    type="checkbox"
    class={`&[aria-disabled=“true”]:opacity-75 ${checkedState(facet.name)}`}
    id={facet.name}
    name={facet.name}
    value={facet}
    {checked}
    disabled={facet.count === 0}
    aria-checked={checked}
    on:click={onClick}
  />
  <span class:opacity-75={facet.count === 0}
    >{`${facet.display} (${facet.count?.toLocaleString()})`}</span
  >
</label>
{#if open && facetsToDisplay !== undefined && facetsToDisplay?.length > 0}
  <div class="flex flex-col ml-4" data-testId={`facet-${facet.name}-children`}>
    {#each facetsToDisplay as child}
      <svelte:self facet={child} {facetCategory} facetParent={facet} {textFilterValue} />
    {/each}
  </div>
{/if}

<style lang="postcss">
  input.indeterminate {
    background-image: url('$lib/assets/dash.svg');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-color: rgb(var(--color-primary-500));
  }

  .arrow-button {
    background-color: transparent;
  }
</style>
