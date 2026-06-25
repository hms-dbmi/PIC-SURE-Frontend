<script lang="ts">
  import { elasticInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { features } from '$lib/configuration';

  import { allFilters, hasGenomicFilter, clearFilters } from '$lib/stores/Filter';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { isObfuscatedBelowThreshold } from '$lib/services/counts/countFormat';
  import { exports, clearExports } from '$lib/stores/Export';
  import { panelOpen } from '$lib/stores/SidePanel';

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

  // ResultsPanel stays mounted (so the panel can animate closed via CSS — a
  // Svelte mount/unmount transition here triggers a 5.39–5.55 effect-detachment
  // freeze), so drive the count lifecycle off panel visibility instead of
  // mount/destroy: load + subscribe only while open, matching prior behavior.
  $effect(() => {
    if (!$panelOpen) return;
    resultCountsState.start(getIsOpenAccess);
    return () => resultCountsState.stop();
  });

  // The panel persists across /discover <-> /explorer navigation, so re-request
  // with the correct open-access flag when that navigation happens.
  $effect(() => {
    if (!page.url.pathname.startsWith(currentPage)) {
      currentPage = page.url.pathname;
      if ($panelOpen) resultCountsState.start(getIsOpenAccess);
    }
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
  class:panel-closed={!$panelOpen}
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

  /* Open/close animate via pure CSS — NOT Svelte's `transition:`/`in:`/`out:`.
     ANY Svelte transition directive on this element re-triggers an effect-tree
     detachment freeze when the panel mounts with filter content (Svelte
     5.39–5.55 regression). So the panel stays mounted (see SidePanel) and we
     transition a `.panel-closed` class instead — CSS transitions run outside
     Svelte's effect/batch scheduler. */
  #results-panel {
    transition:
      width 400ms ease,
      padding 400ms ease,
      opacity 250ms ease,
      transform 400ms ease;
  }

  #results-panel.panel-closed {
    width: 0;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateX(1.5rem);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    #results-panel {
      transition: none;
    }
  }
</style>
