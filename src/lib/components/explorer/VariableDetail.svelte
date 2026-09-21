<script lang="ts">
  import { isOpenAccess } from '$lib/AccessState';
  import { config } from '$lib/configuration.svelte';
  import type { SearchSection, VariableKey } from '$lib/explorer/variableUrl';
  import { log, createLog, getPageContext } from '$lib/logger';
  import type { FilterType } from '$lib/models/Filter.svelte';
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { exports, addExport, removeExport, mapSearchResultAsExport } from '$lib/stores/Export';
  import { filters } from '$lib/stores/Filter';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import AddFilter from '$lib/components/explorer/AddFilter.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';

  // One variable's page, shared by the Explore and Discover routes so both are thin wrappers
  // - which is what keeps the stigmatising-filter `beforeNavigate` guard in
  // `(picsure)/+layout.svelte` matching on pathname as it does for every other route. Each
  // route knows which section it is, so it says so rather than the page reading it back off
  // the pathname.
  let { section, variableKey }: { section: SearchSection; variableKey?: VariableKey } = $props();

  // Back returns to the section the user searched in. Nothing refetches: the search session
  // belongs to the /explorer and /discover layouts, which this page renders inside of.
  const backHref = $derived(`/${section}`);

  // A 200 is not proof of a concept: `handleResponse` returns body text when the body will
  // not parse as JSON, and `{}` parses fine. Either would render an empty heading over an
  // information card that cannot load, so both count as the lookup failing.
  function isConcept(response: unknown): response is SearchResult {
    const concept = response as SearchResult | undefined;
    return Boolean(concept?.conceptPath && concept?.dataset);
  }

  // `undefined` while loading. Held here rather than in an `{#await}` so the rest of the page
  // can derive from the loaded concept.
  let variable: SearchResult | undefined = $state();
  let failed = $state(false);

  $effect(() => {
    const key = variableKey;
    variable = undefined;
    failed = false;
    if (!key) return;
    // Navigating variable to variable keeps this component mounted, so a slow first load must
    // not overwrite a fast second one.
    let current = true;
    getConceptDetails(key.conceptPath, key.dataset).then(
      (response) => {
        if (!current) return;
        if (isConcept(response)) variable = response;
        else failed = true;
      },
      () => {
        if (current) failed = true;
      },
    );
    return () => {
      current = false;
    };
  });

  // The same rule as the results row's filter icon: an open-access visitor may not filter on a
  // variable the dictionary marks unfilterable.
  const filteringDisabled = $derived(
    isOpenAccess() && variable !== undefined && !variable.allowFiltering,
  );

  /**
   * The filter already applied to this variable, if there is one.
   *
   * The chip in the cohort panel and this page's filter interface are two views of one filter,
   * so opening a variable that already has one has to edit it rather than add a second:
   * `addFilter` appends to the tree without checking, so a second add would leave two filters
   * on the same variable and no way to tell them apart. A filter's `id` is its concept path
   * (see `createCategoricalFilter`), which is what identifies the variable.
   *
   * Only the two types this interface can express. An `AnyRecordOf` filter carries a category
   * node's concept path, and handing one to `AddFilter` would silently rewrite it as a
   * categorical filter the next time the user pressed add.
   */
  const EDITABLE_FILTER_TYPES: FilterType[] = ['Categorical', 'numeric'];
  const existingFilter = $derived.by(() => {
    const conceptPath = variable?.conceptPath;
    if (!conceptPath) return undefined;
    return $filters.find(
      (filter) => filter.id === conceptPath && EDITABLE_FILTER_TYPES.includes(filter.filterType),
    );
  });

  /**
   * The entry in Added Variables for this variable, found by concept path.
   *
   * Not by object identity: `mapSearchResultAsExport` mints a fresh object per call, and
   * `addExport` already keys on concept path, so a reference test would disagree with the
   * store the moment the concept is fetched again. One key, used by both the state and the
   * action.
   */
  const exportedVariable = $derived.by(() => {
    const conceptPath = variable?.conceptPath;
    return conceptPath ? $exports.find((item) => item.conceptPath === conceptPath) : undefined;
  });

  // Add for Analysis has nowhere else to live once the per-row icons go, so the gate is the
  // same one those icons use: exports switched on, and not open access.
  const showExportToggle = $derived(
    config.features.explorer.exportsEnableExport && !isOpenAccess(),
  );

  function toggleExport() {
    if (!variable) return;
    const exported = exportedVariable;
    log(
      createLog('ACTION', `search_result.${exported ? 'export_remove' : 'export_add'}`, {
        variable: variable.display || variable.name,
        conceptPath: variable.conceptPath,
        pageContext: getPageContext(),
      }),
    );
    if (exported) {
      removeExport(exported);
    } else {
      addExport(mapSearchResultAsExport(variable));
    }
  }
</script>

<div data-testid="variable-detail" class="flex flex-col gap-4">
  <div>
    <AngleButton href={backHref} data-testid="variable-detail-back">
      Back to Search Results
    </AngleButton>
  </div>

  {#if !variableKey}
    <ErrorAlert data-testid="variable-detail-error" title="We could not read that variable link">
      <p class="m-0">
        This address is missing the information needed to look a variable up. Go back to the search
        results and open the variable from there.
      </p>
    </ErrorAlert>
  {:else if failed}
    <!-- A key that decoded cleanly but that the dictionary does not know: a variable that
         has been re-indexed away, a hand-edited URL, or the dictionary being down. -->
    <ErrorAlert data-testid="variable-detail-error" title="We could not find that variable">
      <p class="m-0">
        Nothing in the data dictionary matches this address. It may have changed since the link was
        made. Go back to the search results and try again.
      </p>
    </ErrorAlert>
  {:else if !variable}
    <Loading ring size="medium" label="Loading variable" />
  {:else}
    <header
      data-testid="variable-identity"
      class="flex flex-wrap items-start justify-between gap-3"
    >
      <div class="flex flex-col gap-1">
        <h1 data-testid="variable-detail-name" class="h4 font-bold m-0">
          {variable.display || variable.name}
        </h1>
        <div class="flex flex-wrap items-center gap-3">
          <span data-testid="variable-detail-study">
            {variable.studyAcronym || variable.dataset}
          </span>
          {#if variable.type}
            <span
              data-testid="variable-detail-type"
              class="badge preset-tonal-surface border border-surface-500 font-normal"
            >
              {variable.type}
            </span>
          {/if}
        </div>
      </div>
      {#if showExportToggle}
        <button
          type="button"
          class="btn preset-filled-primary-500 flex-none"
          data-testid="variable-detail-export-toggle"
          onclick={toggleExport}
        >
          {#if exportedVariable}
            <i class="fa-regular fa-square-check" aria-hidden="true"></i>
          {:else}
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
          {/if}
          {exportedVariable ? 'Remove from Analysis' : 'Add for Analysis'}
        </button>
      {/if}
    </header>

    <section data-testid="variable-detail-information">
      <ResultInfoComponent data={variable} />
    </section>

    <!-- The designed layout replaces this interface in a later change; this is the wiring, so
         AddFilter goes in as-is. -->
    <section data-testid="variable-detail-filter" class="flex flex-col gap-2">
      <h2 class="h5 text-primary-500 m-0">Add Filter</h2>
      {#if filteringDisabled}
        <ErrorAlert color="warning" data-testid="variable-detail-filter-disabled">
          <p class="m-0">Filtering is not available for this variable</p>
        </ErrorAlert>
      {:else}
        <!-- Keyed on the filter being edited, because AddFilter reads `existingFilter` in
             `onMount` and never again. Without the key, adding a filter here would leave the
             interface still believing there is none, and pressing add a second time would
             append a duplicate filter on the same variable instead of updating the first. -->
        {#key existingFilter?.uuid}
          <AddFilter data={variable} {existingFilter} />
        {/key}
      {/if}
    </section>

    {#if config.features.explorer.enableHierarchy}
      <section data-testid="variable-detail-hierarchy" class="flex flex-col gap-2">
        <h2 class="h5 text-primary-500 m-0">Data Hierarchy</h2>
        <HierarchyComponent data={variable} />
      </section>
    {/if}
  {/if}
</div>
