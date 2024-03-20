<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { crossfade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { ProgressRadial, getToastStore } from '@skeletonlabs/skeleton';

  const toastStore = getToastStore();

  const [send, receive] = crossfade({
    fallback(node) {
      const style = getComputedStyle(node);
      const transform = style.transform === 'none' ? '' : style.transform;

      return {
        easing: quintOut,
        css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
      };
    },
  });
  export let options: string[] = [];
  export let allOptions: string[] = options;
  export let selectedOptions: string[] = [];
  export let showSelectAll: boolean = true;
  export let loadMore: (searchTerm: string) => Promise<string[]>;

  let searchInput: string = '';
  let selectedOptionEndLocation = 20;
  let optionsContainer: HTMLElement;
  let selelectedOptionsContainer: HTMLElement;
  let currentlyLoading = false;
  let hasLoadedAll = false;

  async function handleScroll() {
    if (!optionsContainer) return;
    if (loadMore === undefined) return;
    if (shouldLoadMore(optionsContainer)) {
      currentlyLoading = true;
      try {
        let nextOptions = await loadMore(searchInput);
        if (nextOptions && Array.isArray(nextOptions) && nextOptions.length > 0) {
          options = [...options, ...nextOptions];
        }
        currentlyLoading = false;
        if (!nextOptions || nextOptions.length === 0) {
          hasLoadedAll = true;
        }
      } catch (error) {
        console.error(error);
        toastStore.trigger({
          message: 'An error occured while loading more options. Please try again later.',
          background: 'variant-filled-error',
        });
        currentlyLoading = false;
      }
    }
  }

  function onSelect(option: string) {
    options = options.filter((o) => o !== option);
    selectedOptions = [...selectedOptions, option];
    if (elementHasScrollbar(optionsContainer)) {
      handleScroll();
    }
  }

  function onUnselect(option: string) {
    selectedOptions = selectedOptions.filter((o) => o !== option);
    options = [option, ...options];
  }

  function elementHasScrollbar(element: HTMLElement) {
    return element.scrollHeight > element.clientHeight;
  }

  function loadMoreSelectedOptions() {
    if (!selelectedOptionsContainer) return;
    if (shouldLoadMore(selelectedOptionsContainer)) {
      selectedOptionEndLocation = selectedOptionEndLocation + 20;
    }
  }

  function shouldLoadMore(element: HTMLElement) {
    const scrollTop = element.scrollTop;
    const containerHeight = element.clientHeight;
    const contentHeight = element.scrollHeight;
    const scrollBuffer = 30;
    return !hasLoadedAll && contentHeight - (scrollTop + containerHeight) <= scrollBuffer;
  }

  $: filteredOptions = options?.filter((option) =>
    option.toLowerCase().includes(searchInput.toLowerCase()),
  );

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
        placeholder="Search..."
      />
      {#if showSelectAll}
        <button
          id="select-all"
          class="btn variant-ringed-surface hover:variant-filled-primary ml-2"
          on:click={() => {
            selectedOptions = allOptions;
            selectedOptionEndLocation = 20;
            options = [];
          }}>Select All</button
        >
      {/if}
    </header>
    <section class="card-body">
      <div
        id="options-container"
        bind:this={optionsContainer}
        class="overflow-scroll scrollbar-color h-25vh"
        on:scroll={() => handleScroll()}
      >
        {#each filteredOptions as option (option)}
          <label
            id="option-{option}"
            class="p-1 m-1 cursor-pointer hover:variant-soft-surface hover:rounded-md"
            in:receive={{ key: option }}
            out:send={{ key: option }}
            role="listitem"
            animate:flip
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
        on:click={() => {
          selectedOptionEndLocation = 20;
          displayedSelectedOptions.forEach((option) => onUnselect(option));
          selectedOptions = [];
        }}
        disabled={selectedOptions.length === 0}>Clear</button
      >
    </header>
    <section class="card-body">
      <!-- on:scroll={() => selectedOptionsScolling} -->
      <div
        id="selected-options-container"
        bind:this={selelectedOptionsContainer}
        class="overflow-scroll scrollbar-color h-25vh"
        on:scroll={() => loadMoreSelectedOptions()}
      >
        {#each displayedSelectedOptions as option (option)}
          <label
            id="option-{option}"
            class="p-1 m-1 hover:variant-soft-surface hover:rounded-md cursor-pointer"
            in:receive={{ key: option }}
            out:send={{ key: option }}
            animate:flip
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
