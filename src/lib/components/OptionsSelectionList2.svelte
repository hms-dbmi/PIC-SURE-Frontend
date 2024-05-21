<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  let searchInput: string = '';
  export let unselectedOptions: string[] = [];
  export let selectedOptions: string[] = [];
  export let allOptions: string[] = unselectedOptions;
  export let currentlyLoading: boolean = false;

  export let showSelectAll: boolean = true;

  let unselectedOptionsContainer: HTMLElement;
  let selectedOptionsContainer: HTMLElement;
  let selectedOptionEndLocation = 20;

  const dispatch = createEventDispatcher<{ scroll: { search: string } }>();

  function shouldLoadMore(element: HTMLElement) {
    const scrollTop = element.scrollTop;
    const containerHeight = element.clientHeight;
    const contentHeight = element.scrollHeight;
    const scrollBuffer = 30;
    const hasLoadedAll = !unselectedOptions || unselectedOptions.length === 0;
    return !hasLoadedAll && contentHeight - (scrollTop + containerHeight) <= scrollBuffer;
  }

  function handleScroll() {
    if (!unselectedOptionsContainer) return;
    if (!currentlyLoading && shouldLoadMore(unselectedOptionsContainer)) {
      dispatch('scroll', { search: searchInput });
    }
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
    selectedOptions = [];
    selectedOptionEndLocation = 20;
  }

  function selectAllOptions() {
    selectedOptions = allOptions;
    selectedOptionEndLocation = 20;
  }

  function loadMoreSelectedOptions() {
    if (!selectedOptionsContainer) return;
    if (shouldLoadMore(selectedOptionsContainer)) {
      selectedOptionEndLocation = selectedOptionEndLocation + 20;
    }
  }

  $: displayedSelectedOptions = selectedOptions.slice(0, selectedOptionEndLocation);
</script>

<div data-testid="optional-selection-list" class="flex w-full">
  <div class="flex flex-1 flex-col h-full p-3 m-1 card">
    <header class="flex pb-1">
      <input
        class="input"
        type="search"
        name="search"
        bind:value={searchInput}
        on:input={onSearch}
        placeholder="Search..."
      />
      {#if showSelectAll}
        <button
          id="select-all"
          class="btn variant-ringed-surface hover:variant-filled-primary ml-2"
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
            id="option-{option}"
            class="p-1 m-1 cursor-pointer hover:variant-soft-surface hover:rounded-md"
            role="listitem"
          >
            <input
              type="checkbox"
              value={option}
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
      <h5>Selected:</h5>
      <button
        id="clear"
        class="btn variant-ringed-surface hover:variant-filled-primary ml-2"
        on:click={clearSelectedOptions}
        disabled={selectedOptions.length === 0}>Clear</button
      >
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
            id="option-{option}"
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
