<script lang="ts">
  import { onDestroy, tick, type Snippet } from 'svelte';

  import Loading from './Loading.svelte';
  import { log, createLog, getPageContext } from '$lib/logger';

  const SEARCH_DEBOUNCE_MS = 250;

  let searchInput: string = $state('');
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;

  interface Props {
    unselectedOptions?: string[];
    selectedOptions?: string[];
    selectedOptionEndLocation?: number;
    currentlyLoading?: boolean;
    showClearAll?: boolean;
    showSelectAll?: boolean;
    showSearch?: boolean;
    allOptionsLoaded?: boolean;
    allOptions?: string[] | undefined;
    onscroll?: (search: string) => void;
    /** Heading over the right-hand column. */
    selectedLabel?: string;
    /** Shown in place of an empty right-hand column, for a list that is optional to fill in. */
    emptySelectedText?: string;
    /** Replaces Clear in the right-hand column's header. */
    selectedAction?: Snippet;
    /**
     * Names the two columns for a screen reader, which otherwise announces a run of
     * checkboxes with no indication of which variable they belong to or which column they are
     * in. Both lists are groups either way; this adds the variable's name to their labels.
     */
    groupLabel?: string;
    /** Drops the per-column card, for a caller that draws the surrounding panel itself. */
    flat?: boolean;
  }

  let {
    unselectedOptions = $bindable([]),
    selectedOptions = $bindable([]),
    selectedOptionEndLocation = $bindable(20),
    currentlyLoading = $bindable(false),
    showClearAll = true,
    showSelectAll = true,
    showSearch = true,
    allOptionsLoaded = false,
    allOptions = undefined,
    onscroll = () => {},
    selectedLabel = 'Selected:',
    emptySelectedText = '',
    selectedAction = undefined,
    groupLabel = '',
    flat = false,
  }: Props = $props();

  // No `h-full` on the flat column: `height: 100%` is a specified cross size, which turns
  // `align-self: stretch` off, and the two columns then take their own content heights - so
  // the right-hand column collapses to its header while nothing is selected, taking the
  // divider between the columns with it. The card layout keeps the height it had.
  const columnClass = $derived(
    flat
      ? 'flex flex-1 flex-col min-w-0'
      : 'flex flex-1 flex-col h-full p-3 m-1 card bg-surface-100 rounded-xl',
  );
  // A fixed 25vh reserves scroll space a four-value variable does not need, which the
  // designed panel does not have room for; the card layout keeps the height it had.
  const listClass = $derived(
    flat ? 'overflow-y-auto scrollbar-color max-h-25vh' : 'overflow-scroll scrollbar-color h-25vh',
  );
  const labelFor = (column: string) => (groupLabel ? `${column} for ${groupLabel}` : column);

  let currentlyLoadingSelected: boolean = $state(false);
  let unselectedOptionsContainer: HTMLElement = $state() as HTMLElement;
  let selectedOptionsContainer: HTMLElement = $state() as HTMLElement;

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
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      onscroll(searchInput);
      unselectedOptionsContainer.scrollTop = 0;
    }, SEARCH_DEBOUNCE_MS);
  }

  onDestroy(() => clearTimeout(searchTimeout));

  /**
   * Follows a value to the column it just moved to.
   *
   * Toggling a value removes its checkbox from the DOM, which drops focus to the document
   * body - so a keyboard user has to tab in from the top of the page again for every value
   * they pick.
   *
   * The checkbox is found by reading the values off the column's own checkboxes, not by
   * building a selector out of one. A value is dictionary data: `#option-don't-know input` is
   * not a valid selector, because a bare apostrophe is not a legal identifier character, and
   * `querySelector` throws a DOMException on it - inside an async call that nothing awaits.
   * `/`, `#`, `.`, `:` and brackets fail the same way, and "Don't know" is in the fixtures.
   * The ids are not unique across the two containers either, so this looks inside the one it
   * means.
   */
  async function focusMovedOption(container: HTMLElement | undefined, option: string) {
    await tick();
    if (!container) return;
    const boxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    boxes.find((box) => box.value === option)?.focus();
  }

  /** Whether the search box as it currently reads admits `option`. */
  function matchesSearch(option: string) {
    const needle = searchInput.trim().toLowerCase();
    return !needle || option.toLowerCase().includes(needle);
  }

  function onSelect(option: string) {
    return (event: Event) => {
      event.preventDefault();
      unselectedOptions = unselectedOptions.filter((o) => o !== option);
      selectedOptions = [...selectedOptions, option].sort();
      focusMovedOption(selectedOptionsContainer, option);
    };
  }

  function onUnselect(option: string) {
    return (event: Event) => {
      event.preventDefault();
      selectedOptions = selectedOptions.filter((o) => o !== option);

      // Back to the left-hand column only if the search box admits it. Unconditionally, a
      // value the term excludes reappears in a column the term is supposed to be narrowing,
      // under a search box still reading that term. Clearing the box brings it back, because
      // a changed term refills the column from the whole list.
      if (matchesSearch(option) && !unselectedOptions.includes(option)) {
        unselectedOptions = [option, ...unselectedOptions];
      }
      focusMovedOption(unselectedOptionsContainer, option);
    };
  }

  function clearSelectedOptions() {
    unselectedOptions = [
      ...unselectedOptions,
      ...selectedOptions.filter((option) => matchesSearch(option)),
    ].sort();
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
    log(
      createLog('ACTION', 'filter.select_all', {
        count: selectedOptions.length,
        pageContext: getPageContext(),
      }),
    );
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
  let allSelectedOptionsLoaded = $derived(
    displayedSelectedOptions.length >= selectedOptions.length,
  );
</script>

<div data-testid="optional-selection-list" class="flex w-full">
  <div class={columnClass}>
    {#if showSearch || showSelectAll}
      <header class="flex pb-1">
        {#if showSearch}
          <input
            class="input text-sm"
            type="search"
            name="search"
            aria-label={labelFor('Search values')}
            bind:value={searchInput}
            oninput={onSearch}
            placeholder="Search..."
          />
        {/if}
        {#if showSelectAll}
          <button
            id="select-all"
            class="btn preset-outlined-surface-500 hover:preset-filled-primary-500 ml-2 text-sm"
            disabled={unselectedOptions.length === 0}
            onclick={selectAllOptions}>Select All</button
          >
        {/if}
      </header>
    {/if}
    <section class="card-body grow" role="group" aria-label={labelFor('Values')}>
      <div
        id="options-container"
        role="list"
        bind:this={unselectedOptionsContainer}
        class={listClass}
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
  <div class={flat ? `${columnClass} border-l border-surface-400-600 pl-4` : columnClass}>
    <header class="flex justify-between pb-1">
      <div class="py-2">{selectedLabel}</div>
      {#if selectedAction}
        {@render selectedAction()}
      {:else if showClearAll}
        <button
          id="clear"
          class="btn preset-outlined-surface-500 hover:preset-filled-primary-500 ml-2 text-sm"
          onclick={clearSelectedOptions}
          disabled={selectedOptions.length === 0}>Clear</button
        >
      {/if}
    </header>
    <section
      class="card-body grow"
      role="group"
      aria-label={labelFor(selectedLabel.replace(/:$/, ''))}
    >
      {#if emptySelectedText && selectedOptions.length === 0}
        <div class="italic opacity-70 p-1" data-testid="selected-empty">{emptySelectedText}</div>
      {/if}
      <div
        id="selected-options-container"
        role="list"
        bind:this={selectedOptionsContainer}
        class={listClass}
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
  /* Not a Tailwind utility, and not an arbitrary value it would accept - so it has to be
     spelled out here, or the list has no height to scroll within and never pages in. */
  .max-h-25vh {
    max-height: 25vh;
  }
</style>
