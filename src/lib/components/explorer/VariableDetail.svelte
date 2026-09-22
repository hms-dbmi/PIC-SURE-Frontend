<script lang="ts">
  import { isOpenAccess } from '$lib/AccessState';
  import { config } from '$lib/configuration.svelte';
  import type { SearchSection, VariableKey } from '$lib/explorer/variableUrl';
  import { log, createLog, getPageContext } from '$lib/logger';
  import type { Filter, FilterType } from '$lib/models/Filter.svelte';
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { exports, addExport, removeExport, mapSearchResultAsExport } from '$lib/stores/Export';
  import { filters } from '$lib/stores/Filter';

  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
  import VariableFilterPanel from '$lib/components/explorer/VariableFilterPanel.svelte';

  // Both detail routes must stay under /explorer and /discover: the stigmatising-filter
  // guard in `(picsure)/+layout.svelte` matches on pathname.
  let { section, variableKey }: { section: SearchSection; variableKey?: VariableKey } = $props();

  const backHref = $derived(`/${section}`);

  // A 200 is not proof of a concept: `handleResponse` returns body text when the body will
  // not parse as JSON, and `{}` parses fine. Either would render an empty heading over an
  // information card that cannot load, so both count as the lookup failing.
  function isConcept(response: unknown): response is SearchResult {
    const concept = response as SearchResult | undefined;
    return Boolean(concept?.conceptPath && concept?.dataset);
  }

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

  const filteringDisabled = $derived(
    isOpenAccess() && variable !== undefined && !variable.allowFiltering,
  );

  // Only the two types this panel can express. An `AnyRecordOf` filter carries a category
  // node's concept path, so it matches on `id` alone - handing one to the panel would
  // rewrite it as a categorical filter, dropping every concept it covered.
  const EDITABLE_FILTER_TYPES: FilterType[] = ['Categorical', 'numeric'];
  const existingFilter = $derived.by(() => {
    const conceptPath = variable?.conceptPath;
    const dataset = variable?.dataset;
    if (!conceptPath) return undefined;
    return $filters.find(
      (filter) =>
        filter.id === conceptPath &&
        filter.dataset === dataset &&
        EDITABLE_FILTER_TYPES.includes(filter.filterType),
    );
  });

  const exportedVariable = $derived.by(() => {
    const conceptPath = variable?.conceptPath;
    return conceptPath ? $exports.find((item) => item.conceptPath === conceptPath) : undefined;
  });

  function filterContentKey(filter: Filter): string {
    if (filter.filterType === 'Categorical') return filter.categoryValues.join('\u0000');
    if (filter.filterType === 'numeric') return `${filter.min ?? ''}\u0000${filter.max ?? ''}`;
    return '';
  }

  /**
   * Keyed on the filter's content, not its uuid: `updateFilter` preserves the uuid, so a
   * uuid-keyed panel would keep the selection it seeded with and write it back over an
   * edit made in the cohort panel's modal.
   */
  const filterRevision = $derived(
    existingFilter ? `${existingFilter.uuid}\u0000${filterContentKey(existingFilter)}` : '',
  );

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

    <section
      data-testid="variable-detail-filter"
      aria-label="Filter on this variable"
      class="flex flex-col gap-2"
    >
      {#if filteringDisabled}
        <ErrorAlert color="warning" data-testid="variable-detail-filter-disabled">
          <p class="m-0">Filtering is not available for this variable</p>
        </ErrorAlert>
      {:else}
        {#key filterRevision}
          <VariableFilterPanel {variable} {existingFilter} />
        {/key}
      {/if}
    </section>

    <section data-testid="variable-detail-information">
      <ResultInfoComponent data={variable} />
    </section>

    {#if config.features.explorer.enableHierarchy}
      <section data-testid="variable-detail-hierarchy" class="flex flex-col gap-2">
        <h2 class="h5 text-primary-500 m-0">Data Hierarchy</h2>
        <HierarchyComponent data={variable} />
      </section>
    {/if}
  {/if}
</div>
