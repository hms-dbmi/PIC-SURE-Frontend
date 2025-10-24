<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import type { Unsubscriber } from 'svelte/store';
  import { slide, scale } from 'svelte/transition';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { features } from '$lib/configuration';

  import { filters, hasGenomicFilter, clearFilters } from '$lib/stores/Filter';
  import { loadPatientCount, hasNonZeroResult } from '$lib/stores/ResultStore';
  import { exports, clearExports } from '$lib/stores/Export';

  import Filters from '$lib/components/explorer/results/Filters.svelte';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Counts from '$lib/components/explorer/results/Counts.svelte';

  let unsubFilters: Unsubscriber | null = null;
  let currentPage: string = page.url.pathname;
  let isOpenAccess = $derived(page.url.pathname.includes('/discover'));
  let isExplorer = $derived(page.url.pathname.includes('/explorer'));
  let modalOpen: boolean = $state(false);

  let hasFilterOrExport = $derived(
    $filters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0),
  );

  let showExportButton = $derived(
    features.explorer.allowExport && !isOpenAccess && hasFilterOrExport && $hasNonZeroResult,
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
    isExplorer && features.explorer.distributionExplorer && hasValidDistributionFilters,
  );

  let showDiscoverDistributions = $derived(
    isOpenAccess && features.discoverFeautures.distributionExplorer && hasValidDistributionFilters,
  );

  let showVariantExplorer = $derived(
    isExplorer && features.explorer.variantExplorer && $hasGenomicFilter,
  );

  let showCohortDetails = $derived(isExplorer && features.explorer.enableCohortDetails);

  let showToolSuite = $derived(
    showCohortDetails ||
      (($filters.length !== 0 || $exports.length !== 0) &&
        (showExplorerDistributions || showDiscoverDistributions || showVariantExplorer)),
  );

  function subscribe() {
    if (!unsubFilters) {
      unsubFilters = filters.subscribe(() => loadPatientCount(isOpenAccess));
    }
  }

  function unsubscribe() {
    if (unsubFilters) {
      unsubFilters();
      unsubFilters = null;
    }
  }

  // The destroy/mount method is not called on page navigation if the page we're navigating to
  // has this same component. This can cause requests that may be pending on one page
  // to load on the next page. Example discover results displaying on explorer page.
  // To fix this, we resubscribe on page navigation with the correct isOpenAccess flag
  // for loadPatientCount method, dropping the previous results and sending a new request.
  // (Subscriber method runs on initial subscription.)
  $effect(() => {
    if (!page.url.pathname.startsWith(currentPage)) {
      // if the current path doesn't start with the saved page path,
      // then it's not a child page and we should reset subscribers.
      // Example- valid:   /explorer -> /explorer/cohort
      //          invalid: /explorer/cohort -> /discover (like a back button action)
      currentPage = page.url.pathname;
      unsubscribe();
      subscribe();
    }
  });

  onMount(subscribe);
  onDestroy(unsubscribe);
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
  <Counts />
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
    <Filters />
    {#if $exports.length > 0}
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
        {#if showCohortDetails}
          <CardButton
            href="/explorer/cohort"
            data-testid="cohort-details-btn"
            title="Cohort Details"
            icon="fa-solid fa-users"
            size="md"
            active={page.url.pathname.includes('explorer/cohort')}
          />
        {/if}
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
</style>
