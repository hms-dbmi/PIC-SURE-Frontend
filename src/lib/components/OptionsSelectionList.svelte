<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  let searchInput: string = '';
  export let unselectedOptions: string[] = [];
  export let selectedOptions: string[] = [];
  export let selectedOptionEndLocation = 20;
  export let currentlyLoading: boolean = false;
  export let showClearAll: boolean = true;
  export let showSelectAll: boolean = true;
  export let allOptionsLoaded: boolean = false;

  export let allOptions: string[] | undefined = undefined;

  let currentlyLoadingSelected: boolean = false;
  let unselectedOptionsContainer: HTMLElement;
  let selectedOptionsContainer: HTMLElement;
  let allSelectedOptionsLoaded: boolean = false;

  const dispatch = createEventDispatcher<{ scroll: { search: string } }>();

  $: infiniteScroll = allOptions === undefined;

  $: totalAvailableOptions = infiniteScroll
    ? Infinity
    : (allOptions?.length || 0) - selectedOptions.length;

  $: allUnselectedOptionsLoaded = infiniteScroll
    ? allOptionsLoaded
    : unselectedOptions.length >= totalAvailableOptions;

  $: allSelectedOptionsLoaded = infiniteScroll
    ? allSelectedOptionsLoaded
    : displayedSelectedOptions.length >= selectedOptions.length;

  $: displayedSelectedOptions = selectedOptions.slice(0, selectedOptionEndLocation);

  function shouldLoadMore(element: HTMLElement, allLoaded: boolean) {
    const scrollTop = element.scrollTop;
    const containerHeight = element.clientHeight;
    const contentHeight = element.scrollHeight;
    const scrollBuffer = 30;
    return !allLoaded && contentHeight - (scrollTop + containerHeight) <= scrollBuffer;
  }

  function handleScroll() {
    if (!unselectedOptionsContainer) return;
    if (
      !currentlyLoading &&
      shouldLoadMore(unselectedOptionsContainer, allUnselectedOptionsLoaded)
    ) {
      dispatch('scroll', { search: searchInput });
    }
  }

  function loadMoreSelectedOptions() {
    if (!selectedOptionsContainer) return;
    currentlyLoadingSelected = true;
    if (shouldLoadMore(selectedOptionsContainer, allSelectedOptionsLoaded)) {
      selectedOptionEndLocation = selectedOptionEndLocation + 20;
    }
    currentlyLoadingSelected = false;
  }

  function onSearch() {
    dispatch('scroll', { search: searchInput });
    unselectedOptionsContainer.scrollTop = 0;
  }

  function onSelect(option: string) {
    unselectedOptions = unselectedOptions.filter((o) => o !== option);
    selectedOptions = [...selectedOptions, option].sort();
  }

  function onUnselect(option: string) {
    selectedOptions = selectedOptions.filter((o) => o !== option);
    unselectedOptions = [option, ...unselectedOptions];
  }

  function clearSelectedOptions() {
    unselectedOptions = [...unselectedOptions, ...selectedOptions].sort();
    selectedOptions = [];
    selectedOptionEndLocation = 20;
  }

  function selectAllOptions() {
    if (allOptions && allOptions?.length !== 0) {
      selectedOptions = allOptions;
      unselectedOptions = [];
      selectedOptionEndLocation = 20;
    } else {
      selectedOptions = [...selectedOptions, ...unselectedOptions];
      unselectedOptions = [];
      selectedOptionEndLocation = 20;
    }
  }

  function getID(option: string) {
    return option.replaceAll(' ', '-').toLowerCase();
  }
</script>

<div data-testid="optional-selection-list" class="flex w-full">
  <div class="flex flex-1 flex-col h-full p-3 m-1 card">
    <header class="flex pb-1">
      <input
        class="input text-sm"
        type="search"
        name="search"
        bind:value={searchInput}
        on:input={onSearch}
        placeholder="Search..."
      />
      {#if showSelectAll}
        <button
          id="select-all"
          class="btn variant-ringed-surface hover:variant-filled-primary ml-2 text-sm"
          disabled={unselectedOptions.length === 0}
          on:click={selectAllOptions}>Select All</button
        >
      {/if}
    </header>
    <section class="card-body">
      <div
        id="options-container"
        bind:this={unselectedOptionsContainer}
        class="overflow-scroll scrollbar-color h-25vh"
        on:scroll={handleScroll}
      >
        {#each unselectedOptions as option}
          <label
            id="option-{getID(option)}"
            class="p-1 m-1 cursor-pointer hover:variant-soft-surface hover:rounded-md"
            role="listitem"
          >
            <input
              type="checkbox"
              value={option}
              class="mr-1 float-left"
              on:click|preventDefault={() => onSelect(option)}
            />
            {option}
          </label>
        {/each}
        {#if currentlyLoading}
          <div class="flex justify-center">
            <ProgressRadial width="w-5" meter="stroke-primary-500" track="stroke-primary-500/30" />
          </div>
        {/if}
      </div>
    </section>
  </div>
  <div class="flex flex-1 flex-col h-full p-3 m-1 card">
    <header class="flex justify-between pb-1">
      <div class="py-2">Selected:</div>
      {#if showClearAll}
        <button
          id="clear"
          class="btn variant-ringed-surface hover:variant-filled-primary ml-2 text-sm"
          on:click={clearSelectedOptions}
          disabled={selectedOptions.length === 0}>Clear</button
        >
      {/if}
    </header>
    <section class="card-body">
      <div
        id="selected-options-container"
        bind:this={selectedOptionsContainer}
        class="overflow-scroll scrollbar-color h-25vh"
        on:scroll={loadMoreSelectedOptions}
      >
        {#each displayedSelectedOptions as option (option)}
          <label
            id="option-{getID(option)}"
            class="p-1 m-1 hover:variant-soft-surface hover:rounded-md cursor-pointer"
            role="listitem"
          >
            <input
              type="checkbox"
              class="mr-1"
              value={option}
              on:click|preventDefault={() => onUnselect(option)}
              checked
            />
            {option}
          </label>
        {/each}
        {#if currentlyLoadingSelected}
          <div class="flex justify-center">
            <ProgressRadial width="w-5" meter="stroke-primary-500" track="stroke-primary-500/30" />
          </div>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .scrollbar-color {
    scrollbar-color: rgba(var(--color-surface-300)) rgb(var(--color-surface-100));
  }
  .h-25vh {
    height: 25vh;
  }
</style>
