<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import type { Unsubscriber } from 'svelte/store';
  import { slide, scale } from 'svelte/transition';

  import { page } from '$app/stores';
  import { afterNavigate, goto, beforeNavigate } from '$app/navigation';

  import * as api from '$lib/api';
  import { branding, features, resources } from '$lib/configuration';
  import { getQueryRequest } from '$lib/QueryBuilder';
  import { loadAllConcepts } from '$lib/services/hpds';

  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { filters, hasGenomicFilter, clearFilters, totalParticipants, removeFilter, addFilter } from '$lib/stores/Filter';
  import { exports, clearExports } from '$lib/stores/Export';
  import { toaster } from '$lib/toaster';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import BooleanSelect from '$lib/components/explorer/BooleanSelect.svelte';
  import MergedFilter from '$lib/components/explorer/MergedFilter.svelte';
  import { JoinTypes, type MergableFilterInterface, type AnyRecordOfFilterInterface } from '$lib/models/Filter';
  
  const ERROR_VALUE = 'N/A';

  let unsubFilters: Unsubscriber;
  let totalPatients: string | number | typeof ERROR_VALUE = $state(0);
  let triggerRefreshCount: Promise<number | typeof ERROR_VALUE> = $state(Promise.resolve(0));
  let isOpenAccess = $state($page.url.pathname.includes('/discover'));
  let modalOpen: boolean = $state(false);
  let currentRequestID = 0;

  async function getCount() {
    suffix = '';
    const requestID = ++currentRequestID;
    let request: QueryRequestInterface = getQueryRequest(
      !isOpenAccess,
      isOpenAccess ? resources.openHPDS : resources.hpds,
      isOpenAccess ? 'CROSS_COUNT' : 'COUNT',
    );
    try {
      if (isOpenAccess) {
        const concepts = await loadAllConcepts();
        request.query.setCrossCountFields(concepts);
      }
      const count = await api.post('picsure/query/sync', request);
      if (requestID !== currentRequestID) {
        return 0;
      }
      if (isOpenAccess) {
        let openTotalPatients = String(count['\\_studies_consents\\']);
        if (openTotalPatients.includes(' \u00B1')) {
          totalPatients = parseInt(openTotalPatients.split(' ')[0]);
          suffix = openTotalPatients.split(' ')[1];
          totalParticipants.set(totalPatients);
        } else {
          totalPatients = openTotalPatients;
          totalParticipants.set(openTotalPatients);
        }
      } else {
        totalParticipants.set(count);
        totalPatients = count;
      }
      return count;
    } catch (error) {
      if ($filters.length !== 0) {
        toaster.error({ description: branding?.explorePage?.filterErrorText, closable: false });
      } else {
        toaster.error({ title: branding?.explorePage?.queryErrorText });
      }
      totalPatients = ERROR_VALUE;
      return 0;
    }
  }
  let suffix = $state('');

  let hasFilterOrExport = $derived(
    $filters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0),
  );

  let showExportButton = $derived(
    features.explorer.allowExport &&
      !isOpenAccess &&
      totalPatients !== ERROR_VALUE &&
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

  onMount(async () => {
    unsubFilters = filters.subscribe(() => {
      triggerRefreshCount = getCount();
    });
  });

  afterNavigate(async () => {
    if (unsubFilters) {
      unsubFilters();
    }

    isOpenAccess = $page.url.pathname.includes('/discover');
    const isExplorer = $page.url.pathname.includes('/explorer');
    if (isExplorer || isOpenAccess) {
      await tick();
      unsubFilters = filters.subscribe(() => {
        triggerRefreshCount = getCount();
      });
    }
  });

  const offerMergeOption = (isLastFilter: boolean) => {
    if ($filters.length > 1 && $filters.slice(-2).every(filter => filter.filterType === 'AnyRecordOf' && filter.displayType !== 'merged')) {
      return !isLastFilter;
    }
    return false;
  }

  const onChange = (value: JoinTypes, filter1: MergableFilterInterface) => {
    const filter2 = $filters.find(filter => filter.id !== filter1.id && filter.filterType === 'AnyRecordOf' && filter.displayType !== 'merged');
    if (!filter2) return;
    createMergableFilter(filter1, filter2 as AnyRecordOfFilterInterface);
  }

  const createMergableFilter = (filter1: AnyRecordOfFilterInterface, filter2: AnyRecordOfFilterInterface) => {
    const newFilter: MergableFilterInterface = {
      ...filter1,
      joinType: JoinTypes.OR,
      displayType: 'merged',
      mergedFilter1: filter1,
      mergedFilter2: filter2,
      concepts: [...filter1.concepts, ...filter2.concepts],
    }
    removeFilter(filter1.uuid);
    removeFilter(filter2.uuid);
    addFilter(newFilter);
  }
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
          {totalPatients?.toLocaleString()} {suffix || ''}
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
        <section class="flex flex-col gap-2 py-1 w-full justify-center">
          {#each $filters as filter, index}
            {#if filter.displayType === 'merged'}
              <MergedFilter filter={filter as MergableFilterInterface} />
            {:else}
              <FilterComponent {filter} />
            {/if}
            {#if offerMergeOption(index === $filters.length - 1) && filter.filterType === 'AnyRecordOf' && filter.displayType !== 'merged'}
              <BooleanSelect 
                value={(filter as MergableFilterInterface).joinType || JoinTypes.AND} 
                onChange={(value) => onChange(value, filter)} 
              />
            {/if}
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
