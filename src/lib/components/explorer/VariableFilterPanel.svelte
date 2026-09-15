<script lang="ts">
  import {
    appliedCategoricalFilter,
    filterForRange,
    filterForSelection,
    filteringRefused,
    relatedVariablesOf,
    selectionFromFilter,
  } from '$lib/explorer/variableFilter';
  import type { Filter } from '$lib/models/Filter.svelte';
  import type { SearchResult } from '$lib/models/Search';
  import {
    addFilter,
    enrichFilterDetails,
    filters,
    removeFilter,
    updateFilter,
  } from '$lib/stores/Filter';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import OptionsSelectionList from '$lib/components/OptionsSelectionList.svelte';

  /**
   * The designed filter interface for one variable, from `p1-04-asthma-detail.png`,
   * `p1-05-asthma-values-selected.png`, `p1-10-eosinophil-detail.png` and, for a variable
   * with related variables, `p2-10-followup-detail.png` / `p2-11-followup-expanded.png`.
   *
   * It takes the concept the page already loaded and asks the dictionary for nothing. The
   * interface this replaces re-fetched the same concept in `onMount` to get at `values`,
   * which cost one redundant POST per page view; a concept detail response carries `values`,
   * and the page has one in hand before this component exists.
   *
   * The caller decides whether the interface can express the concept at all
   * (`Categorical` or `Continuous`) and whether the variable already has a filter. It also
   * has to key this component on the *content* of that filter rather than its uuid - the
   * draft below is seeded once, on purpose, so that typing is not overwritten, which means an
   * edit made elsewhere has to remount the panel. See `VariableDetail.svelte`.
   */
  interface Props {
    variable: SearchResult;
    existingFilter?: Filter;
    /**
     * Whether this is an open-access view, which decides whether a variable the dictionary
     * marks unfilterable may be filtered on. The caller applies it to the main variable
     * before rendering this at all; the related variables below are a second way into the
     * cohort and are held to it here.
     */
    openAccess?: boolean;
  }

  let { variable, existingFilter, openAccess = false }: Props = $props();

  const PAGE_SIZE = 20;
  /** Past this many values the list pages in on scroll rather than rendering in full. */
  const PAGING_THRESHOLD = 50;

  const variableName = $derived(variable.display || variable.name);

  /**
   * One variable's draft selection: the main variable, or one of its related variables.
   *
   * `unselected` is what the left-hand column shows, which is not simply "the rest": it is
   * narrowed by the search box and paged in on scroll.
   */
  type Draft = {
    concept: SearchResult;
    selected: string[];
    unselected: string[];
    lastSearch: string;
    open: boolean;
  };

  function draftFor(concept: SearchResult, applied?: Filter): Draft {
    const values = concept.values ?? [];
    const selected = selectionFromFilter(values, applied);
    const rest = values.filter((value) => !selected.includes(value));
    return {
      concept,
      selected,
      unselected: rest.length >= PAGING_THRESHOLD ? rest.slice(0, PAGE_SIZE) : rest,
      lastSearch: '',
      // A related variable that already constrains the cohort opens, so its selection is not
      // hidden behind a collapsed row.
      open: selected.length > 0,
    };
  }

  /**
   * The Categorical filter already applied to a related variable - the counterpart of the
   * `existingFilter` prop, for a concept the caller does not name.
   *
   * It seeds that variable's draft once, at creation; read live everywhere else, because the
   * action has to know what it is editing or removing. The caller remounts this component
   * when any of these filters changes, so the two readings never disagree.
   */
  function appliedFilterFor(concept: SearchResult): Filter | undefined {
    return appliedCategoricalFilter(concept.conceptPath, $filters);
  }

  /**
   * Whether a related variable may be filtered on at all.
   *
   * The same rule the caller applies to the main variable. Without it, a related variable the
   * dictionary marks unfilterable could be ticked on an open-access page and its filter would
   * go into the cohort query - routing around a restriction the application makes both on the
   * results row and on that variable's own detail page.
   */
  const refused = (concept: SearchResult) => filteringRefused(concept, openAccess);

  // Seeded from the props once, which is the point: this is a draft the user edits, and a
  // derived one would discard a half-finished selection on every unrelated store change. The
  // caller remounts this component when the applied filter changes underneath it, so reading
  // the props at creation is how the draft stays in step. Hence the ignores.
  // svelte-ignore state_referenced_locally
  let main: Draft = $state(draftFor(variable, existingFilter));
  // svelte-ignore state_referenced_locally
  let related: Draft[] = $state(
    relatedVariablesOf(variable).map((child) => draftFor(child, appliedFilterFor(child))),
  );

  const isComplex = $derived(related.length > 0);

  // svelte-ignore state_referenced_locally
  let minInput: string = $state(
    existingFilter?.filterType === 'numeric' ? (existingFilter.min ?? '') : '',
  );
  // svelte-ignore state_referenced_locally
  let maxInput: string = $state(
    existingFilter?.filterType === 'numeric' ? (existingFilter.max ?? '') : '',
  );

  // `null` as well as `undefined`: `min` and `max` are typed as optional numbers, but they
  // come out of a JSON response and the dictionary does send nulls.
  const bound = (value: number | null | undefined) =>
    value !== undefined && value !== null ? value.toString() : '';

  /**
   * Fills the left-hand column from the values the search box admits.
   *
   * Called by the list on scroll and after the search box settles. A changed term starts the
   * column over, so that narrowing does not leave the previous term's values on screen.
   *
   * Synchronous, because the values are already in hand - so this does not drive the list's
   * loading spinner, which exists for the genomic filter's list and pages from the API.
   */
  function loadMore(draft: Draft) {
    return (search: string = '') => {
      const values = draft.concept.values ?? [];
      if (values.length === 0) return;

      if (search !== draft.lastSearch) {
        draft.unselected = [];
        draft.lastSearch = search;
      }

      const chosen = new Set(draft.selected);
      const needle = search.toLowerCase();
      const matching = values.filter(
        (value) => !chosen.has(value) && (!needle || value.toLowerCase().includes(needle)),
      );
      const shown = new Set(draft.unselected);
      draft.unselected = [
        ...draft.unselected,
        ...matching.filter((value) => !shown.has(value)).slice(0, PAGE_SIZE),
      ];
    };
  }

  /**
   * Whether the main interface has been filled in.
   *
   * Both bounds left blank is a deliberate filter for a continuous variable - everyone with a
   * measurement, which is what the cohort chip reads back - but only where the main variable
   * is the only thing this panel can write. With related variables under it, `filterForRange`
   * always returning a filter meant that touching one of those also put an any-value numeric
   * filter on the main path: one press, two chips, one restriction the user never picked. A
   * categorical main variable was already exempt, because an empty selection is not a filter.
   */
  const mainEngaged = $derived(
    variable.type === 'Continuous'
      ? minInput !== '' || maxInput !== '' || !isComplex
      : main.selected.length > 0,
  );

  /** Related variables the action would write a filter for, or take one away from. */
  const relatedWrites = $derived(
    related.filter((draft) => !refused(draft.concept) && draft.selected.length > 0),
  );
  const relatedClears = $derived(
    related.filter(
      (draft) =>
        !refused(draft.concept) &&
        draft.selected.length === 0 &&
        appliedFilterFor(draft.concept) !== undefined,
    ),
  );

  const canFilter = $derived(mainEngaged || relatedWrites.length > 0 || relatedClears.length > 0);

  /**
   * Writes the draft to the cohort.
   *
   * A variable with a selection becomes its own filter on its own concept path, because that
   * is what a filter is keyed on. One with none has no filter - and if it had one before,
   * that filter goes: skipped instead, the panel read "All included by default" while the
   * query it describes was still constrained.
   *
   * A continuous main variable is the exception in the other direction. Blank bounds are
   * indistinguishable from an applied any-value filter seeded back into the same inputs, so
   * there is nothing here to tell "left alone" from "cleared" - it is written when filled in
   * and otherwise left exactly as it was.
   */
  function apply() {
    if (!canFilter) return;

    if (mainEngaged) {
      const primary =
        variable.type === 'Continuous'
          ? filterForRange(variable, minInput, maxInput)
          : filterForSelection(variable, main.selected);
      if (primary) applyOne(primary, variable, existingFilter);
    } else if (variable.type !== 'Continuous' && existingFilter) {
      removeFilter(existingFilter.uuid);
    }

    for (const draft of relatedWrites) {
      const filter = filterForSelection(draft.concept, draft.selected);
      if (filter) applyOne(filter, draft.concept, appliedFilterFor(draft.concept));
    }
    for (const draft of relatedClears) {
      const applied = appliedFilterFor(draft.concept);
      if (applied) removeFilter(applied.uuid);
    }
  }

  function applyOne(filter: Filter, concept: SearchResult, applied?: Filter) {
    if (applied) {
      updateFilter(applied.uuid, filter);
    } else {
      addFilter(filter);
    }
    // Fills in the table and study the cohort panel's chip shows; the panel opens itself once
    // the cohort gains something, so there is nothing to do here for that.
    enrichFilterDetails(filter, concept.conceptPath, concept.dataset);
  }

  function toggleRelated(index: number) {
    related[index].open = !related[index].open;
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
  <!-- A variable with related variables names itself on the action's line, so that the value
       list below it is visibly the main variable's and not the panel's as a whole. -->
  {#if isComplex}
    <div class="flex items-start justify-between gap-4">
      <span class="italic font-semibold" data-testid="variable-filter-panel-name">
        {variableName}
      </span>
      {@render filterButton()}
    </div>
  {/if}

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
      {#if !isComplex}
        {@render filterButton()}
      {/if}
    </div>
  {:else}
    <div>
      <OptionsSelectionList
        flat
        groupLabel={variableName}
        selectedLabel="Selected values:"
        showClearAll={false}
        selectedAction={isComplex ? undefined : filterButton}
        allOptions={variable.values}
        bind:unselectedOptions={main.unselected}
        bind:selectedOptions={main.selected}
        onscroll={loadMore(main)}
      />
    </div>
  {/if}

  {#each related as draft, index (draft.concept.conceptPath)}
    <div class="border-t border-surface-300-700 pt-2" data-testid="related-variable">
      <button
        type="button"
        class="w-full flex items-center justify-between gap-4 cursor-pointer text-left"
        data-testid="related-variable-toggle"
        aria-expanded={draft.open}
        onclick={() => toggleRelated(index)}
      >
        <span class="italic">{draft.concept.display || draft.concept.name}</span>
        <i class="fas {draft.open ? 'fa-chevron-down' : 'fa-chevron-right'}" aria-hidden="true"></i>
      </button>
      {#if draft.open && refused(draft.concept)}
        <!-- The same reason the page gives for the main variable, said where the user is
             being refused rather than by leaving the values off with no explanation. -->
        <ErrorAlert color="warning" data-testid="related-variable-disabled">
          <p class="m-0">Filtering is not available for this variable</p>
        </ErrorAlert>
      {:else if draft.open}
        <OptionsSelectionList
          flat
          showSearch={false}
          showSelectAll={false}
          showClearAll={false}
          groupLabel={draft.concept.display || draft.concept.name}
          selectedLabel="Selected values:"
          emptySelectedText="All included by default"
          allOptions={draft.concept.values}
          bind:unselectedOptions={related[index].unselected}
          bind:selectedOptions={related[index].selected}
          onscroll={loadMore(related[index])}
        />
      {/if}
    </div>
  {/each}
</div>
