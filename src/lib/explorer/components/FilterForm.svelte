<script lang="ts">
  import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
  import { type Filter, studyLabel } from '#lib/query/filter.svelte.ts';
  import { buildFilter } from '#lib/explorer/filterBuilder.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  import OptionsSelectionList from '#lib/ui/OptionsSelectionList.svelte';
  import { cardClass } from '#lib/ui/surface.ts';
  import Button from '#lib/ui/Button.svelte';

  interface Props {
    concept: SearchResult;
    existingFilter?: Filter;
    onadded: (filter: Filter) => void;
  }

  let { concept, existingFilter, onadded }: Props = $props();

  const pageSize = 20;
  // One shared empty selection, so re-reading props with no filter doesn't reset the draft.
  const noSelection: string[] = [];
  let lastSearchTerm = '';
  let loading = $state(false);

  const bound = (value: number | string | undefined | null) =>
    value !== undefined && value !== null ? value.toString() : '';

  // Writable deriveds: the user edits a draft that starts over when the concept or filter changes.
  let initialSelection: string[] = $derived.by(() => {
    if (existingFilter?.filterType !== 'Categorical') return noSelection;
    return existingFilter.categoryValues.length === 0
      ? concept.values || []
      : existingFilter.categoryValues;
  });
  let selectedOptions = $derived(initialSelection);
  let unselectedOptions: string[] = $derived.by(() => {
    const unselected = (concept.values || []).filter((value) => !initialSelection.includes(value));
    return unselected.length >= 50 ? unselected.slice(0, pageSize) : unselected;
  });
  let minFormValue = $derived(
    existingFilter?.filterType === 'numeric' ? bound(existingFilter.min) : '',
  );
  let maxFormValue = $derived(
    existingFilter?.filterType === 'numeric' ? bound(existingFilter.max) : '',
  );

  let min = $derived(bound(concept.min));
  let max = $derived(bound(concept.max));

  function addNewFilter() {
    const filter = buildFilter(concept, {
      values: [...selectedOptions],
      min: minFormValue,
      max: maxFormValue,
    });
    if (filter) onadded(filter);
  }

  function logSelectAll(count: number) {
    log(createLog('ACTION', 'filter.select_all', { count, pageContext: getPageContext() }));
  }

  function getNextValues(search: string = '') {
    const allOptions = concept.values || [];
    if (allOptions.length === 0) return;

    loading = true;
    if (search !== lastSearchTerm) {
      unselectedOptions = [];
      lastSearchTerm = search;
    }

    const selected = new Set(selectedOptions);
    const needle = search.toLowerCase();
    const displayed = new Set(unselectedOptions);
    const nextOptions = allOptions
      .filter(
        (option) =>
          !selected.has(option) &&
          !displayed.has(option) &&
          (!needle || option.toLowerCase().includes(needle)),
      )
      .slice(0, pageSize);

    unselectedOptions = [...unselectedOptions, ...nextOptions];
    loading = false;
  }
</script>

<div>
  <div class="variable-info">
    {#if existingFilter}
      {#if concept.display}
        <div class="variable-name">Variable Name: {concept.display}</div>
      {/if}
      {#if concept.description}
        <div class="variable-desc">Variable Description: {concept.description}</div>
      {/if}
      {#if studyLabel(concept)}
        <div class="variable-study">Study: {studyLabel(concept)}</div>
      {/if}
    {/if}
  </div>
  <div class="flex justify-between" data-testid="filter-component">
    {#if concept.type === 'Categorical'}
      <div data-testid="filter-categorical" class="w-full">
        <OptionsSelectionList
          bind:unselectedOptions
          bind:selectedOptions
          bind:currentlyLoading={loading}
          allOptions={concept.values}
          onscroll={getNextValues}
          onselectall={logSelectAll}
        />
      </div>
    {:else if concept.type === 'Continuous'}
      <div class="{cardClass} bg-surface-100 p-3 m-1 w-full">
        <section class="card-body flex grow gap-4" data-testid="filter-numerical">
          <label class="flex-auto flex-col">
            <span>Min: {min}</span>
            <input
              data-testid="filter-numerical-min"
              type="text"
              placeholder="Enter value or leave blank for variable min"
              class="input"
              bind:value={minFormValue}
            />
          </label>
          <label class="flex-auto flex-col">
            <span>Max: {max}</span>
            <input
              data-testid="filter-numerical-max"
              type="text"
              placeholder="Enter value or leave blank for variable max"
              class="input"
              bind:value={maxFormValue}
            />
          </label>
        </section>
      </div>
    {/if}
    <Button
      size="icon"
      class="m-1 h-fit"
      data-testid="filter-add"
      aria-label="Add Filter"
      onclick={addNewFilter}
      disabled={concept.type === 'Categorical' && selectedOptions.length === 0}
    >
      <i class="fas fa-plus"></i>
    </Button>
  </div>
</div>
