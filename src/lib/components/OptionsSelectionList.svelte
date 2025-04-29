<script lang="ts">
  import Loading from './Loading.svelte';

  let searchInput: string = $state('');

  interface Props {
    unselectedOptions?: string[];
    selectedOptions?: string[];
    selectedOptionEndLocation?: number;
    currentlyLoading?: boolean;
    showClearAll?: boolean;
    showSelectAll?: boolean;
    allOptionsLoaded?: boolean;
    allOptions?: string[] | undefined;
    onscroll?: (search: string) => void;
  }

  let {
    unselectedOptions = $bindable([]),
    selectedOptions = $bindable([]),
    selectedOptionEndLocation = $bindable(20),
    currentlyLoading = $bindable(false),
    showClearAll = true,
    showSelectAll = true,
    allOptionsLoaded = false,
    allOptions = undefined,
    onscroll = () => {},
  }: Props = $props();

  let currentlyLoadingSelected: boolean = $state(false);
  let unselectedOptionsContainer: HTMLElement = $state() as HTMLElement;
  let selectedOptionsContainer: HTMLElement = $state() as HTMLElement;
  let allSelectedOptionsLoaded: boolean = $state(false);

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
      onscroll(searchInput);
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
    onscroll(searchInput);
    unselectedOptionsContainer.scrollTop = 0;
  }

  function onSelect(option: string) {
    return (event: Event) => {
      event.preventDefault();
      unselectedOptions = unselectedOptions.filter((o) => o !== option);
      selectedOptions = [...selectedOptions, option].sort();
    };
  }

  function onUnselect(option: string) {
    return (event: Event) => {
      event.preventDefault();
      selectedOptions = selectedOptions.filter((o) => o !== option);
      unselectedOptions = [option, ...unselectedOptions];
    };
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
  let infiniteScroll = $derived(allOptions === undefined);
  let totalAvailableOptions = $derived(
    infiniteScroll ? Infinity : (allOptions?.length || 0) - selectedOptions.length,
  );
  let allUnselectedOptionsLoaded = $derived(
    infiniteScroll ? allOptionsLoaded : unselectedOptions.length >= totalAvailableOptions,
  );
  let displayedSelectedOptions = $derived(selectedOptions.slice(0, selectedOptionEndLocation));
  $effect(() => {
    allSelectedOptionsLoaded = infiniteScroll
      ? allSelectedOptionsLoaded
      : displayedSelectedOptions.length >= selectedOptions.length;
  });
</script>

<div data-testid="optional-selection-list" class="flex w-full">
  <div class="flex flex-1 flex-col h-full p-3 m-1 card bg-surface-100 rounded-xl">
    <header class="flex pb-1">
      <input
        class="input text-sm"
        type="search"
        name="search"
        bind:value={searchInput}
        oninput={onSearch}
        placeholder="Search..."
      />
      {#if showSelectAll}
        <button
          id="select-all"
          class="btn preset-outlined-surface-500 hover:preset-filled-primary-500 ml-2 text-sm"
          disabled={unselectedOptions.length === 0}
          onclick={selectAllOptions}>Select All</button
        >
      {/if}
    </header>
    <section class="card-body">
      <div
        id="options-container"
        bind:this={unselectedOptionsContainer}
        class="overflow-scroll scrollbar-color h-25vh"
        onscroll={handleScroll}
      >
        {#each unselectedOptions as option}
          <label
            id="option-{getID(option)}"
            class="p-1 m-1 block cursor-pointer hover:preset-tonal-surface hover:rounded-md"
            role="listitem"
          >
            <input
              type="checkbox"
              value={option}
              class="mr-1 float-left"
              onclick={onSelect(option)}
            />
            {option}
          </label>
        {/each}
        {#if currentlyLoading}
          <Loading ring size="small" />
        {/if}
      </div>
    </section>
  </div>
  <div class="flex flex-1 flex-col h-full p-3 m-1 card bg-surface-100 rounded-xl">
    <header class="flex justify-between pb-1">
      <div class="py-2">Selected:</div>
      {#if showClearAll}
        <button
          id="clear"
          class="btn preset-outlined-surface-500 hover:preset-filled-primary-500 ml-2 text-sm"
          onclick={clearSelectedOptions}
          disabled={selectedOptions.length === 0}>Clear</button
        >
      {/if}
    </header>
    <section class="card-body">
      <div
        id="selected-options-container"
        bind:this={selectedOptionsContainer}
        class="overflow-scroll scrollbar-color h-25vh"
        onscroll={loadMoreSelectedOptions}
      >
        {#each displayedSelectedOptions as option (option)}
          <label
            id="option-{getID(option)}"
            class="p-1 m-1 block hover:preset-tonal-surface hover:rounded-md cursor-pointer"
            role="listitem"
          >
            <input
              type="checkbox"
              class="mr-1"
              value={option}
              onclick={onUnselect(option)}
              checked
            />
            {option}
          </label>
        {/each}
        {#if currentlyLoadingSelected}
          <Loading />
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .scrollbar-color {
    scrollbar-color: var(--color-surface-300) var(--color-surface-100);
  }
  .h-25vh {
    height: 25vh;
  }
</style>
