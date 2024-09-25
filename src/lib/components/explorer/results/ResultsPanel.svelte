<script lang="ts">
  import { branding, features, resources } from '$lib/configuration';
  import { slide, scale } from 'svelte/transition';
  import { navigating, page } from '$app/stores';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import { filters, hasGenomicFilter, clearFilters, totalParticipants } from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import * as api from '$lib/api';
  import { ProgressRadial, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  import { elasticInOut } from 'svelte/easing';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Unsubscriber } from 'svelte/store';
  import { getQueryRequest } from '$lib/QueryBuilder';
  import { loadAllConcepts } from '$lib/services/hpds';

  const { exports, clearExports } = ExportStore;

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  const ERROR_VALUE = 'N/A';

  let unsubFilters: Unsubscriber;
  let unsubNav: Unsubscriber;
  let totalPatients: string | number | typeof ERROR_VALUE = 0;
  let triggerRefreshCount: Promise<number | typeof ERROR_VALUE> = Promise.resolve(0);
  let isOpenAccess = $page.url.pathname.includes('/discover');

  async function getCount() {
    suffix = '';
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
        toastStore.trigger({
          message: branding?.explorePage?.filterErrorText,
          background: 'variant-filled-error',
          autohide: false,
          hoverable: true,
        });
      } else {
        toastStore.trigger({
          message: branding?.explorePage?.queryErrorText,
          background: 'variant-filled-error',
        });
      }
      totalPatients = ERROR_VALUE;
      return 0;
    }
  }

  function clearFiltersModal() {
    modalStore.trigger({
      type: 'confirm',
      title: 'Clear All Filters',
      body: 'Are you sure you want to clear all filters?',
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: (yes: boolean) => {
        if (yes) {
          clearFilters();
          clearExports();
        }
      },
    });
  }

  $: suffix = '';
  $: hasFilterOrExport =
    $filters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0);
  $: showExportButton =
    features.explorer.allowExport &&
    !isOpenAccess &&
    totalPatients !== ERROR_VALUE &&
    totalPatients !== 0 &&
    hasFilterOrExport;

  onMount(async () => {
    unsubFilters = filters.subscribe(() => {
      triggerRefreshCount = getCount();
    });
    unsubNav = navigating.subscribe(() => {
      isOpenAccess = $page.url.pathname.includes('/discover');
      triggerRefreshCount = getCount();
    });
  });

  onDestroy(() => {
    unsubFilters && unsubFilters();
    unsubNav && unsubNav();
  });
</script>

<section
  id="results-panel"
  class="flex flex-col items-center pt-8 pr-10 w-64"
  transition:slide={{ axis: 'x' }}
>
  <div class="flex flex-col items-center mt-2">
    {#await triggerRefreshCount}
      <ProgressRadial width="w-6" />
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
        class="btn variant-filled-primary"
        on:click={() => goto('/explorer/export')}
        transition:scale={{ easing: elasticInOut }}
      >
        Prepare for Analysis
      </button>
    </div>
  {/if}
  <div id="export-filters" class="flex flex-col items-center mt-7 w-80">
    <hr class="!border-t-2" />
    <div class="flex content-center mt-7">
      <h5 class="text-xl flex-auto mr-2">Filtered Data Summary</h5>
      {#if hasFilterOrExport}
        <button
          data-testid="clear-all-results-btn"
          class="anchor text-sm flex-none"
          on:click={clearFiltersModal}>Reset</button
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
  {#if totalPatients !== 0 && ($filters.length !== 0 || $exports.length !== 0)}
    <div class="flex flex-col items-center mt-7">
      <hr class="!border-t-2" />
      <h5 class="text-center text-xl mt-7">Tool Suite</h5>
      <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">
        {#if !isOpenAccess && features.explorer.distributionExplorer && $filters.length !== 0}
          <CardButton
            href="/explorer/distributions"
            data-testid="distributions-btn"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
          />
        {/if}
        {#if isOpenAccess && features.discoverFeautures.distributionExplorer && $filters.length !== 0}
          <CardButton
            href="/discover/distributions"
            data-testid="distributions-btn"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
          />
        {/if}
        {#if !isOpenAccess && features.explorer.variantExplorer && $hasGenomicFilter}
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
