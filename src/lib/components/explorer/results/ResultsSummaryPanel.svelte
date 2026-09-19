<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/state';

  import { config } from '$lib/configuration.svelte';
  import { showsSearchChrome } from '$lib/explorer/searchChrome';
  import { exports } from '$lib/stores/Export';
  import { allFilters } from '$lib/stores/Filter';
  import { panelOpen } from '$lib/stores/ResultsSummaryPanel';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { sanitizeHTML } from '$lib/utilities/HTML';
  import { log, createLog } from '$lib/logger';

  import Counts from '$lib/components/explorer/results/Counts.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ResultsPanel from '$lib/components/explorer/results/ResultsPanel.svelte';

  const BODY_ID = 'results-panel-body';

  let visible = $derived(showsSearchChrome(page.url.pathname));
  let filterCount = $derived($allFilters.length);
  let filterSummary = $derived(
    filterCount === 0
      ? 'No filters added, add below'
      : `${filterCount} filter${filterCount === 1 ? '' : 's'} added`,
  );
  let hasCountError = $derived(
    !resultCountsState.loading && resultCountsState.snapshot.summary.hasError,
  );

  let isOpenAccess = $derived(page.url.pathname.includes('/discover'));

  // The layout renders one instance that never unmounts, so the count restart has to key off
  // the route - Discover counts are the open-access ones - not off mount.
  $effect(() => {
    if (!visible) return;
    const openAccess = isOpenAccess;
    resultCountsState.start(() => openAccess);
    return () => resultCountsState.stop();
  });

  // Subscribed rather than opened at the add sites: a sessionStorage restore on load and a
  // dataset restore before navigation both fill these stores with no interaction on this page.
  onMount(() => {
    const unsubFilters = allFilters.subscribe((filterList) => {
      if (filterList?.length !== 0) panelOpen.set(true);
    });
    const unsubExports = exports.subscribe((exportList) => {
      if (exportList?.length !== 0) panelOpen.set(true);
    });
    return () => {
      unsubFilters();
      unsubExports();
    };
  });

  function toggle() {
    panelOpen.update((open) => {
      log(createLog('ACTION', 'results_panel.toggle', { open: !open }));
      return !open;
    });
  }
</script>

{#if visible}
  <section
    id="results-summary-panel"
    data-testid="results-summary-panel"
    aria-label="Cohort summary"
    class="card bg-surface-50-950 border border-surface-300-700 rounded-container"
  >
    <button
      type="button"
      id="results-panel-toggle"
      data-testid="results-summary-strip"
      class="w-full flex items-center justify-between gap-4 px-6 py-3 text-left cursor-pointer rounded-container hover:bg-surface-100-900"
      aria-expanded={$panelOpen}
      aria-controls={BODY_ID}
      onclick={toggle}
    >
      <Counts />
      <span class="flex items-center gap-4">
        <span data-testid="results-panel-filter-count">{filterSummary}</span>
        <i class="fa-solid {$panelOpen ? 'fa-chevron-down' : 'fa-chevron-right'}" aria-hidden="true"
        ></i>
      </span>
    </button>
    <!-- The count's only error report: start() does not toast, so this has to be here. -->
    {#if hasCountError}
      <ErrorAlert color="warning" iconSize="2xl" data-testid="count-error-alert">
        <p class="text-sm !m-0">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html sanitizeHTML(config.branding.explorePage.queryErrorText)}
        </p>
      </ErrorAlert>
    {/if}
    <!-- Rendered whether or not the panel is open so `aria-controls` always resolves. -->
    <div id={BODY_ID} data-testid="results-panel-body">
      {#if $panelOpen}
        <ResultsPanel />
      {/if}
    </div>
  </section>
{/if}
