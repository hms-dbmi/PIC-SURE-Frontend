<script lang="ts">
  import {
    filterForRange,
    filterForSelection,
    selectionFromFilter,
  } from '$lib/explorer/variableFilter';
  import type { Filter } from '$lib/models/Filter.svelte';
  import type { SearchResult } from '$lib/models/Search';
  import { addFilter, enrichFilterDetails, updateFilter } from '$lib/stores/Filter';

  import OptionsSelectionList from '$lib/components/OptionsSelectionList.svelte';

  interface Props {
    variable: SearchResult;
    existingFilter?: Filter;
  }

  let { variable, existingFilter }: Props = $props();

  const PAGE_SIZE = 20;
  const PAGING_THRESHOLD = 50;

  const variableName = $derived(variable.display || variable.name);

  type Draft = {
    concept: SearchResult;
    selected: string[];
    visibleUnselected: string[];
    lastSearch: string;
    loading: boolean;
  };

  function draftFor(concept: SearchResult, applied?: Filter): Draft {
    const values = concept.values ?? [];
    const selected = selectionFromFilter(values, applied);
    const rest = values.filter((value) => !selected.includes(value));
    return {
      concept,
      selected,
      visibleUnselected: rest.length >= PAGING_THRESHOLD ? rest.slice(0, PAGE_SIZE) : rest,
      lastSearch: '',
      loading: false,
    };
  }

  // Seeded from the props once, which is the point: this is a draft the user edits, and a
  // derived one would discard a half-finished selection on every unrelated store change. The
  // caller remounts this component when the applied filter changes underneath it, so reading
  // the props at creation is how the draft stays in step. Hence the ignores.
  // svelte-ignore state_referenced_locally
  let main: Draft = $state(draftFor(variable, existingFilter));

  // svelte-ignore state_referenced_locally
  let minInput: string = $state(
    existingFilter?.filterType === 'numeric' ? (existingFilter.min ?? '') : '',
  );
  // svelte-ignore state_referenced_locally
  let maxInput: string = $state(
    existingFilter?.filterType === 'numeric' ? (existingFilter.max ?? '') : '',
  );

  const bound = (value: number | undefined) =>
    value !== undefined && value !== null ? value.toString() : '';

  function loadMore(draft: Draft) {
    return (search: string = '') => {
      const values = draft.concept.values ?? [];
      if (values.length === 0) return;

      draft.loading = true;
      if (search !== draft.lastSearch) {
        draft.visibleUnselected = [];
        draft.lastSearch = search;
      }

      const chosen = new Set(draft.selected);
      const needle = search.toLowerCase();
      const matching = values.filter(
        (value) => !chosen.has(value) && (!needle || value.toLowerCase().includes(needle)),
      );
      const shown = new Set(draft.visibleUnselected);
      draft.visibleUnselected = [
        ...draft.visibleUnselected,
        ...matching.filter((value) => !shown.has(value)).slice(0, PAGE_SIZE),
      ];
      draft.loading = false;
    };
  }

  const hasSelection = $derived(main.selected.length > 0);

  // A range with both bounds blank is a filter: everyone with a measurement. A value list
  // with nothing ticked is not, so the button waits for a tick.
  const canFilter = $derived(variable.type === 'Continuous' || hasSelection);

  function apply() {
    if (!canFilter) return;

    const filter =
      variable.type === 'Continuous'
        ? filterForRange(variable, minInput, maxInput)
        : filterForSelection(variable, main.selected);
    if (!filter) return;

    if (existingFilter) {
      updateFilter(existingFilter.uuid, filter);
    } else {
      addFilter(filter);
    }
    enrichFilterDetails(filter, variable.conceptPath, variable.dataset);
  }
</script>

{#snippet filterButton()}
  <button
    type="button"
    class="btn preset-filled-primary-500 flex-none"
    data-testid="filter-participants"
    onclick={apply}
    disabled={!canFilter}
  >
    Filter Participants
  </button>
{/snippet}

<div
  data-testid="variable-filter-panel"
  class="card bg-surface-100-900 border border-surface-300-700 rounded-container p-4 flex flex-col gap-3"
>
  {#if variable.type === 'Continuous'}
    <div class="flex flex-wrap items-end justify-between gap-4" data-testid="numerical-filter">
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2">
          <span class="font-bold">Min:</span>
          <input
            id="min"
            data-testid="min-input"
            type="text"
            class="input"
            placeholder={bound(variable.min)}
            bind:value={minInput}
          />
        </label>
        <label class="flex items-center gap-2">
          <span class="font-bold">Max:</span>
          <input
            id="max"
            data-testid="max-input"
            type="text"
            class="input"
            placeholder={bound(variable.max)}
            bind:value={maxInput}
          />
        </label>
      </div>
      {@render filterButton()}
    </div>
  {:else}
    <div data-testid="categoical-filter">
      <OptionsSelectionList
        flat
        groupLabel={variableName}
        selectedLabel="Selected values:"
        selectedAction={filterButton}
        allOptions={variable.values}
        bind:unselectedOptions={main.visibleUnselected}
        bind:selectedOptions={main.selected}
        bind:currentlyLoading={main.loading}
        onscroll={loadMore(main)}
      />
    </div>
  {/if}
</div>
