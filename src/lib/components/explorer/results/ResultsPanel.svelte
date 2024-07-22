<script lang="ts">
  import { branding, features } from '$lib/configuration';
  import { slide, scale } from 'svelte/transition';
  import { page } from '$app/stores';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import ExportedVariable from '$lib/components/explorer/results/ExportedVariable.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import FilterStore from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import * as api from '$lib/api';
  import {
    ProgressRadial,
    getModalStore,
    type ModalSettings,
    type ToastSettings,
    getToastStore,
  } from '@skeletonlabs/skeleton';
  import { elasticInOut } from 'svelte/easing';
  import { onDestroy } from 'svelte';

  const { filters, hasGenomicFilter, getQueryRequest, clearFilters } = FilterStore;
  const { exports, clearExports } = ExportStore;

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  let totalPatients = 0;

  const modal: ModalSettings = {
    type: 'component',
    title: 'Export Data',
    component: 'stepper',
    response: (r: string) => {
      console.log(r);
    },
  };

  let triggerRefreshCount = getCount();

  async function getCount() {
    let request: QueryRequestInterface = getQueryRequest();
    try {
      totalPatients = await api.post('picsure/query/sync', request);
      return totalPatients;
    } catch (error) {
      const toast: ToastSettings = {
        message: branding.explorePage.queryErrorText,
        background: 'variant-filled-error',
      };
      toastStore.trigger(toast);
      return 0;
    }
  }

  const unsubFilters = filters.subscribe(() => {
    triggerRefreshCount = getCount();
  });

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

  $: hasFilterOrExport =
    $filters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0);
  $: showExportButton = features.explorer.allowExport && totalPatients !== 0 && hasFilterOrExport;

  onDestroy(unsubFilters);
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
      <span id="result-count" class="text-4xl">{totalPatients}</span>
    {:catch}
      <span id="result-count" class="text-4xl">N/A</span>
    {/await}
    <h4 class="text-center">{branding.explorePage.totalPatientsText}</h4>
  </div>
  <div class="h-11 mt-4">
    {#if showExportButton}
      <button
        id="export-data-button"
        type="button"
        class="btn variant-filled-primary"
        on:click={() => modalStore.trigger(modal)}
        transition:scale={{ easing: elasticInOut }}
      >
        Prepare for Analysis
      </button>
    {/if}
  </div>
  <div class="flex flex-col items-center mt-11">
    <div class="flex content-center">
      <h5 class="font-bold text-lg flex-auto mr-2">Added to Export</h5>
      {#if hasFilterOrExport}
        <button
          data-testid="clear-all-results-btn"
          class="anchor text-sm flex-none"
          on:click={clearFiltersModal}>Clear All</button
        >
      {/if}
    </div>
    {#if $filters.length === 0}
      <p class="text-center">No filters added</p>
    {:else}
      <div class="px-4 mb-1 w-80">
        <header class="text-left ml-1">
          <strong>Filters added</strong>
          <hr class="!border-t-2" />
        </header>
        <section class="py-1">
          {#each $filters as filter}
            <FilterComponent {filter} />
          {/each}
        </section>
      </div>
    {/if}
    {#if $exports.length !== 0}
      <div class="px-4 mb-1 w-80">
        <header class="text-left ml-1" data-testid="export-header">
          <strong>Exports added</strong>
          <hr class="!border-t-2" />
        </header>
        <section class="py-1">
          {#each $exports as variable (variable.variableId)}
            <ExportedVariable {variable} />
          {/each}
        </section>
      </div>
    {/if}
  </div>
  {#if $filters.length > 0}
    <div class="flex flex-col items-center mt-8">
      <h5 class="text-center font-bold text-lg py-2">Explore Cohort</h5>
      <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">
        <CardButton
          data-testid="distributions-btn"
          title="Variable Distributions"
          icon="fa-solid fa-chart-pie"
          size="md"
        />
        {#if totalPatients !== 0 && features.explorer.variantExplorer && $hasGenomicFilter}
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
