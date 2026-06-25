<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import { fly, scale } from 'svelte/transition';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { features } from '$lib/configuration';

  import { allFilters, hasGenomicFilter, clearFilters } from '$lib/stores/Filter';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { isObfuscatedBelowThreshold } from '$lib/services/counts/countFormat';
  import { exports, clearExports } from '$lib/stores/Export';

  import Filters from '$lib/components/explorer/results/Filters.svelte';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Counts from '$lib/components/explorer/results/Counts.svelte';
  import { log, createLog } from '$lib/logger';

  let currentPage: string = $state(page.url.pathname);
  let isDiscoverPage = $derived(currentPage.includes('/discover'));
  let modalOpen: boolean = $state(false);

  let hasFilterOrExport = $derived(
    $allFilters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0),
  );

  let showExportButton = $derived(
    features.explorer.allowExport &&
      !isDiscoverPage &&
      hasFilterOrExport &&
      (resultCountsState.loading || resultCountsState.hasNonZero),
  );

  let hasValidDistributionFilters = $derived(
    $allFilters.length !== 0 &&
      !$allFilters.every(
        (filter) =>
          filter.filterType === 'genomic' ||
          filter.filterType === 'snp' ||
          filter.filterType === 'AnyRecordOf',
      ),
  );

  let showExplorerDistributions = $derived(
    !isDiscoverPage && features.explorer.distributionExplorer && hasValidDistributionFilters,
  );

  let showDiscoverDistributions = $derived(
    isDiscoverPage &&
      features.discover &&
      features.discoverFeautures.distributionExplorer &&
      hasValidDistributionFilters,
  );

  let showVariantExplorer = $derived(
    !isDiscoverPage && features.explorer.variantExplorer && $hasGenomicFilter,
  );

  let distributionsDisabled = $derived(
    resultCountsState.loading ||
      (isDiscoverPage
        ? isObfuscatedBelowThreshold(resultCountsState.total) ||
          (resultCountsState.total as number) < 10
        : resultCountsState.total === 0),
  );

  const getIsOpenAccess = () => isDiscoverPage;

  // The destroy/mount method is not called on page navigation if the page we're navigating to
  // has this same component. This can cause requests that may be pending on one page
  // to load on the next page. Example discover results displaying on explorer page.
  // To fix this, we restart on page navigation with the correct isOpenAccess flag,
  // dropping the previous results and sending a new request.
  $effect(() => {
    if (!page.url.pathname.startsWith(currentPage)) {
      currentPage = page.url.pathname;
      resultCountsState.start(getIsOpenAccess);
    }
  });

  onMount(() => {
    resultCountsState.start(getIsOpenAccess);
  });
  onDestroy(() => {
    resultCountsState.stop();
  });
</script>

<Modal
  bind:open={modalOpen}
  title="Clear All Filters"
  withDefault
  confirmText="Yes"
  cancelText="No"
  onconfirm={() => {
    clearFilters();
    clearExports();
  }}
>
  Are you sure you want to clear all filters?
</Modal>
<section
  id="results-panel"
  class="flex flex-col items-center pt-8 pr-10 w-64"
  out:fly={{ x: 24, duration: 400 }}
>
  <Counts />
  {#if showExportButton}
    <div class="h-11 mt-4">
      <button
        id="export-data-button"
        type="button"
        class="btn preset-filled-primary-500"
        disabled={resultCountsState.loading}
        onclick={() => {
          log(createLog('ACTION', 'explorer.prepare_for_analysis'));
          goto('/explorer/export');
        }}
        transition:scale={{ easing: elasticInOut }}
      >
        Prepare for Analysis
      </button>
    </div>
  {/if}
  <div id="export-filters" class="flex flex-col items-center mt-7 w-80">
    <hr />
    <div class="flex content-center items-center mt-6">
      <h5 class="text-xl flex-auto ml-9 mr-2 mb-2 pt-1">Filtered Data Summary</h5>
      {#if hasFilterOrExport}
        <button
          data-testid="clear-all-results-btn"
          class="btn btn-xs preset-tonal-error border border-error-500 hover:preset-filled-error-500 flex-none"
          onclick={() => (modalOpen = true)}>Reset</button
        >
      {/if}
    </div>
    <Filters {isDiscoverPage} />
    {#if $exports.length > 0}
      <div class="px-4 mb-1 w-80">
        <header class="text-left ml-1" data-testid="export-header">
          Added Variables
          {#if $exports.length > 10}
            <button
              data-testid="clear-all-results-btn"
              class="anchor text-sm flex-none float-right mr-2"
              onclick={() => {
                $exports = [];
              }}>Clear</button
            >
          {/if}
        </header>
        <section class="py-1">
          {#each $exports as variable (variable.id)}
            <ExportedVariable {variable} />
          {/each}
        </section>
      </div>
    {/if}
  </div>
  {#if showExplorerDistributions || showDiscoverDistributions || showVariantExplorer}
    <div class="flex flex-col items-center mt-7">
      <hr />
      <h5 class="text-center text-xl mt-7">Tool Suite</h5>
      <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">
        {#if showExplorerDistributions}
          <CardButton
            href="/explorer/distributions"
            id="explorer-distributions-btn"
            data-testid="distributions-btn"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
            disabled={distributionsDisabled}
          />
        {/if}
        {#if showDiscoverDistributions}
          <CardButton
            href="/discover/distributions"
            id="explorer-distributions-btn"
            data-testid="distributions-btn"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
            disabled={distributionsDisabled}
          />
        {/if}
        {#if showVariantExplorer}
          <CardButton
            href="/explorer/variant"
            data-testid="variant-explorer-btn"
            title="Variant Explorer"
            icon="fa-solid fa-dna"
            size="md"
            active={page.url.pathname.includes('explorer/variant')}
          />
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  hr {
    width: 88%;
  }

  /* Open (mount) animates via pure CSS instead of Svelte's `transition:slide`.
     A Svelte parent INTRO transition firing alongside this panel's child intro
     transitions (export button, filter chips) during mount triggers an
     effect-tree-detachment freeze on Svelte 5.39–5.55. CSS animations run on
     element insertion without going through Svelte's effect/batch scheduler, so
     they sidestep the regression. Close (unmount) uses Svelte `out:fly` in the
     markup — an outro-only transition, which doesn't hit the regression and is
     the only way to animate node removal. Keep both at the same duration. */
  #results-panel {
    animation: results-panel-in 400ms ease-out;
  }

  @keyframes results-panel-in {
    from {
      transform: translateX(1.5rem);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #results-panel {
      animation: none;
    }
  }
</style>
