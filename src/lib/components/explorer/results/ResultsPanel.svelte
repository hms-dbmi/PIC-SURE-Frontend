<script lang="ts">
  import { branding, features } from '$lib/configuration';
  import { slide, scale } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import FilterComponent from './AddedFilter.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import ExportedVariable from './ExportedVariable.svelte';
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

  filters.subscribe(() => {
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
        <button
          type="button"
          class="leading-4 flex flex-col w-28 max-w-28 h-28 items-center justify-center rounded-container-token hover:scale-110 hover:variant-ghost-surface"
          aria-label="Variable Distributions"
        >
          <i class="fa-solid fa-chart-pie text-4xl"></i>
          <span>Variable Distributions</span>
        </button>
        {#if totalPatients !== 0 && features.explorer.variantExplorer && $hasGenomicFilter}
          <button
            type="button"
            data-testid="variant-explorer-btn"
            class="leading-4 flex flex-col w-28 max-w-28 h-28 items-center justify-center rounded-container-token hover:scale-110 hover:variant-ghost-surface"
            class:variant-ghost-primary={$page.url.pathname.includes('explorer/variant')}
            aria-label="Variant Explorer"
            title="Variant Explorer"
            on:click={() => goto('/explorer/variant')}
          >
            <i class="fa-solid fa-dna text-4xl"></i>
            <span>Variant Explorer</span>
          </button>
        {/if}
      </div>
    </div>
  {/if}
</section>
