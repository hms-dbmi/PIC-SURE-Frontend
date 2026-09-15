<script lang="ts">
  import { resolve } from '$app/paths';
  import { elasticInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { config } from '$lib/configuration.svelte';
  import { isDiscoverSection, searchRoute } from '$lib/explorer/searchChrome';

  import { allFilters, hasGenomicFilter, clearFilters } from '$lib/stores/Filter';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { isObfuscatedBelowThreshold } from '$lib/services/counts/countFormat';
  import { exports, clearExports } from '$lib/stores/Export';

  import Filters from '$lib/components/explorer/results/Filters.svelte';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { log, createLog } from '$lib/logger';

  let isDiscoverPage = $derived(isDiscoverSection(page.url.pathname));
  // Segment-matched like the section above, though the exposure is narrower: dictionary data
  // cannot reach this one, because a variable's detail route interposes `/variable/` and so
  // never spells `explorer/variant`. What it guards is a future sibling route whose name
  // merely starts with the word - `/explorer/variants` would have lit the card up.
  let isVariantPage = $derived.by(() => {
    const { section, child } = searchRoute(page.url.pathname);
    return section === 'explorer' && child === 'variant';
  });
  let modalOpen: boolean = $state(false);

  let hasFilterOrExport = $derived(
    $allFilters.length !== 0 ||
      (config.features.explorer.exportsEnableExport && $exports.length !== 0),
  );

  let showExportButton = $derived(
    config.features.explorer.allowExport &&
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
    !isDiscoverPage && config.features.explorer.distributionExplorer && hasValidDistributionFilters,
  );

  let showDiscoverDistributions = $derived(
    isDiscoverPage &&
      config.features.discover &&
      config.features.explorer.distributionExplorer &&
      hasValidDistributionFilters,
  );

  let showVariantExplorer = $derived(
    !isDiscoverPage && config.features.explorer.variantExplorer && $hasGenomicFilter,
  );

  let distributionsDisabled = $derived(
    resultCountsState.loading ||
      (isDiscoverPage
        ? isObfuscatedBelowThreshold(resultCountsState.total)
        : resultCountsState.total === 0),
  );
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
<section id="results-panel" class="flex flex-col items-center px-6 pt-2 pb-6">
  {#if showExportButton}
    <div class="h-11 mt-4">
      <button
        id="export-data-button"
        type="button"
        class="btn preset-filled-primary-500"
        disabled={resultCountsState.loading}
        onclick={() => {
          log(createLog('ACTION', 'explorer.prepare_for_analysis'));
          goto(resolve('/explorer/export'));
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
            href={resolve('/explorer/distributions')}
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
            href={resolve('/discover/distributions')}
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
            href={resolve('/explorer/variant')}
            data-testid="variant-explorer-btn"
            title="Variant Explorer"
            icon="fa-solid fa-dna"
            size="md"
            active={isVariantPage}
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
</style>
