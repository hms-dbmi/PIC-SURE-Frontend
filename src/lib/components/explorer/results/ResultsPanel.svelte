<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import type { Unsubscriber } from 'svelte/store';
  import { slide, scale } from 'svelte/transition';

  import { page } from '$app/stores';
  import { afterNavigate, goto, beforeNavigate } from '$app/navigation';

  import { branding, features, resources } from '$lib/configuration';

  import { filters, hasGenomicFilter, clearFilters } from '$lib/stores/Filter';
  import { getPatientCount, type PatientCount } from '$lib/stores/ResultStore';
  import { exports, clearExports } from '$lib/stores/Export';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Loading from '$lib/components/Loading.svelte';

  const ERROR_VALUE = 'N/A';

  let unsubFilters: Unsubscriber;
  let totalPatients: PatientCount = $state(0);
  let patientSuffix = $state('');
  let triggerRefreshCount: Promise<void | { suffix: string, count: PatientCount }> = $state(Promise.resolve({ suffix: '', count: 0 }));
  let isOpenAccess = $state($page.url.pathname.includes('/discover'));
  let modalOpen: boolean = $state(false);

  let hasFilterOrExport = $derived(
    $filters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0),
  );

  let showExportButton = $derived(
    features.explorer.allowExport &&
      !isOpenAccess &&
      totalPatients + "" !== ERROR_VALUE &&
      totalPatients !== 0 &&
      hasFilterOrExport,
  );

  let hasValidDistributionFilters = $derived(
    $filters.length !== 0 &&
      !$filters.every(
        (filter) =>
          filter.filterType === 'genomic' ||
          filter.filterType === 'snp' ||
          filter.filterType === 'AnyRecordOf',
      ),
  );

  let showExplorerDistributions = $derived(
    !isOpenAccess && features.explorer.distributionExplorer && hasValidDistributionFilters,
  );

  let showDiscoverDistributions = $derived(
    isOpenAccess && features.discoverFeautures.distributionExplorer && hasValidDistributionFilters,
  );

  let showVariantExplorer = $derived(
    !isOpenAccess && features.explorer.variantExplorer && $hasGenomicFilter,
  );

  let showToolSuite = $derived(
    totalPatients !== 0 &&
      ($filters.length !== 0 || $exports.length !== 0) &&
      (showExplorerDistributions || showDiscoverDistributions || showVariantExplorer),
  );

  function countSubscriber() {
    const resource = isOpenAccess ? resources.openHPDS : resources.hpds;
    const type = isOpenAccess ? 'CROSS_COUNT' : 'COUNT';
    triggerRefreshCount = getPatientCount(isOpenAccess, resource, type)
      .then(({ suffix, count }) => {
        totalPatients = count;
        patientSuffix = suffix;
      });
  }

  onMount(async () => {
    unsubFilters = filters.subscribe(countSubscriber);
  });

  afterNavigate(async () => {
    if (unsubFilters) {
      unsubFilters();
    }

    isOpenAccess = $page.url.pathname.includes('/discover');
    const isExplorer = $page.url.pathname.includes('/explorer');
    if (isExplorer || isOpenAccess) {
      await tick();
      unsubFilters = filters.subscribe(countSubscriber);
    }
  });

  beforeNavigate(() => {
    unsubFilters && unsubFilters();
  });

  onDestroy(() => {
    unsubFilters && unsubFilters();
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
  transition:slide={{ axis: 'x' }}
>
  <div class="flex flex-col items-center mt-2">
    {#await triggerRefreshCount}
      <Loading ring />
    {:then}
      <span id="result-count" class="text-4xl">
        {#if totalPatients === ERROR_VALUE}
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span class="sr-only">{ERROR_VALUE}</span>
        {:else}
          {totalPatients?.toLocaleString()} {patientSuffix || ''}
        {/if}
      </span>
    {:catch}
      <span id="result-count" class="text-4xl">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span class="sr-only">{ERROR_VALUE}</span>
      </span>
    {/await}
    <h4 class="text-center">{branding?.explorePage?.totalPatientsText}</h4>
  </div>
  {#if showExportButton}
    <div class="h-11 mt-4">
      <button
        id="export-data-button"
        type="button"
        class="btn preset-filled-primary-500"
        onclick={() => goto('/explorer/export')}
        transition:scale={{ easing: elasticInOut }}
      >
        Prepare for Analysis
      </button>
    </div>
  {/if}
  <div id="export-filters" class="flex flex-col items-center mt-7 w-80">
    <hr />
    <div class="flex content-center mt-7">
      <h5 class="text-xl flex-auto mr-2 mb-2">Filtered Data Summary</h5>
      {#if hasFilterOrExport}
        <button
          data-testid="clear-all-results-btn"
          class="anchor text-sm flex-none"
          onclick={() => (modalOpen = true)}>Reset</button
        >
      {/if}
    </div>
    {#if $filters.length === 0 && $exports.length === 0}
      <p class="text-center">No filters added</p>
    {:else}
      <div class="px-4 mb-1 w-80">
        {#if $filters.length !== 0}
          <header class="text-left ml-1">Filters</header>
        {/if}
        <section class="py-1">
          {#each $filters as filter}
            <FilterComponent {filter} />
          {/each}
        </section>
      </div>
    {/if}
    {#if $exports.length !== 0}
      <div class="px-4 mb-1 w-80">
        <header class="text-left ml-1" data-testid="export-header">Added Variables</header>
        <section class="py-1">
          {#each $exports as variable (variable.id)}
            <ExportedVariable {variable} />
          {/each}
        </section>
      </div>
    {/if}
  </div>
  {#if showToolSuite}
    <div class="flex flex-col items-center mt-7">
      <hr />
      <h5 class="text-center text-xl mt-7">Tool Suite</h5>
      <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">
        {#if showExplorerDistributions}
          <CardButton
            href="/explorer/distributions"
            data-testid="distributions-btn"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
          />
        {/if}
        {#if showDiscoverDistributions}
          <CardButton
            href="/discover/distributions"
            data-testid="distributions-btn"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
          />
        {/if}
        {#if showVariantExplorer}
          <CardButton
            href="/explorer/variant"
            data-testid="variant-explorer-btn"
            title="Variant Explorer"
            icon="fa-solid fa-dna"
            size="md"
            active={$page.url.pathname.includes('explorer/variant')}
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
