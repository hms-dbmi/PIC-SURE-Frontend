<script lang="ts">
  import { branding, resources, features } from '$lib/configuration';
  import { slide, scale } from 'svelte/transition';
  import FilterComponent from './AddedFilter.svelte';
  import { Query } from '$lib/models/query/Query';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import ExportedVariable from './ExportedVariable.svelte';
  import FilterStore from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import { derived } from 'svelte/store';
  import * as api from '$lib/api';
  import {
    ProgressRadial,
    getModalStore,
    type ModalSettings,
    type ToastSettings,
    getToastStore,
  } from '@skeletonlabs/skeleton';
  import { elasticInOut } from 'svelte/easing';

  const { filters } = FilterStore;
  const { exports } = ExportStore;

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
    let newQuery = new Query();
    $filters.forEach((filter) => {
      if (filter.filterType === 'categorical') {
        if (filter.displayType === 'restrict') {
          newQuery.addCategoryFilter(filter.id, filter.categoryValues);
        } else {
          newQuery.addRequiredField(filter.id);
        }
      } else if (filter.filterType === 'numeric') {
        newQuery.addNumericFilter(filter.id, filter.min || '', filter.max || '');
      }
    });
    let request: QueryRequestInterface = {
      query: newQuery,
      resourceUUID: resources.hpds,
    };
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

  $: showExportButton =
    features.explorer.allowExport &&
    ($filters.length !== 0 || (features.explorer.exportsEnableExport && $exports.length !== 0)) &&
    totalPatients !== 0;
</script>

<section
  id="results-panel"
  class="flex flex-col items-center pt-8 pr-10 section-width"
  transition:slide={{ axis: 'x' }}
>
  <!-- <h3>Results Panel</h3> -->
  <div class="h-11">
    {#if showExportButton}
      <button
        id="export-data-button"
        type="button"
        class="btn variant-filled-primary"
        on:click={() => modalStore.trigger(modal)}
        transition:scale={{ easing: elasticInOut }}
      >
        Export Data
      </button>
    {/if}
  </div>
  <div class="flex flex-col items-center mt-6">
    {#await triggerRefreshCount}
      <ProgressRadial width="w-6" />
    {:then}
      <span id="result-count">{totalPatients}</span>
    {:catch}
      <span id="result-count">N/A</span>
    {/await}
    <h4 class="text-center">{branding.explorePage.totalPatientsText}</h4>
  </div>
  <div class="flex flex-col items-center mt-8">
    <h5 class="underline">Added to Export</h5>
    {#if $filters.length === 0}
      <p class="text-center">No filters added</p>
    {:else}
      <div class="px-4 py-1 w-80">
        <header class="text-primary-500 text-left">
          <strong>Filters added</strong>
          <hr class="!border-t-2" />
        </header>
        <section>
          {#each $filters as filter}
            <FilterComponent {filter} />
          {/each}
        </section>
      </div>
    {/if}
    {#if $exports.length !== 0}
      <div class="px-4 py-1 w-80">
        <header class="text-primary-500 font-extrabold text-left" data-testid="export-header">
          Exports added
          <hr class="!border-t-2" />
        </header>
        <section>
          {#each $exports as variable (variable.variableId)}
            <ExportedVariable {variable} />
          {/each}
        </section>
      </div>
    {/if}
  </div>
  <div class="flex flex-col items-center mt-8">
    <h5 class="text-center underline">Explore Chort</h5>
    <div class="flex flex-wrap items-center justify-evenly w-9/12">
      <button
        type="button"
        class="btn btn-lg-sq variant-ringed-surface"
        aria-label="Visualizations"
      >
        <i class="fa-solid fa-chart-pie"></i>
      </button>
      <button
        type="button"
        class="btn btn-lg-sq variant-ringed-surface"
        aria-label="Vairant Explorer"
      >
        <i class="fa-solid fa-dna"></i>
      </button>
    </div>
  </div>
</section>

<style>
  #result-count {
    font-size: 2.5rem;
  }
  .btn-lg-sq {
    flex: 50%;
  }
  .btn-lg-sq i {
    font-size: 2.5rem;
    color: rgba(var(--color-primary-500));
  }
  .section-width {
    width: 20rem;
  }
</style>
