<script lang='ts'>
  import { branding, resources } from '$lib/configuration';
  import { slide } from 'svelte/transition';
  import FilterComponent from './FilterComponent.svelte';
  import { Query } from '$lib/models/query/Query';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import ExportedVariable from './ExportedVariable.svelte';
  import FilterStore from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import * as api from '$lib/api';
  import { ProgressRadial, getModalStore,type ModalSettings, type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';
  
  const { filters } = FilterStore;
  const { exports } = ExportStore;

  let totalPatients = 0;

  const modal: ModalSettings = {
    type: 'component',
    title: 'Export Data',
    component: 'stepper',
    modalClasses: '',
    response: (r: string) => {
      console.log(r);
    },
  };
  const modalStore = getModalStore();
  const toastStore = getToastStore();

  async function query() {
    let query = new Query();
    let request: QueryRequestInterface = {
      query: query,
      resourceUUID: resources.hpds,
    };
    try {
      totalPatients = await api.post('picsure/query/sync', request);
    } catch (error) {
      const toast: ToastSettings = {
        message: branding.explorePage.queryErrorText,
        background: 'variant-filled-error',
      };
      toastStore.trigger(toast);
      return 0;
    }
  }

  $: exportHidden= ($exports.length === 0 && $filters.length === 0) || totalPatients === 0;
</script>

<section id="results-panel" class="flex flex-col items-center pt-8 pr-10 w-full" transition:slide={{ axis: 'x' }}>
  <button
    id="export-data-button"
    type="button"
    class="btn variant-filled-primary {exportHidden ? 'invisible' : ''}"
    on:click={() => modalStore.trigger(modal)}
  >
    Export Data
  </button>
  <div class="flex flex-col items-center mt-6">
    {#await query()}
      <ProgressRadial width="w-6" />
    {:then}
      <h2 id="result-count">{totalPatients}</h2>
    {/await}
    <h5 class="text-center">{branding.explorePage.totalPatientsText}</h5>
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
          {#each $filters as filter (filter.uuid)}
            <FilterComponent {filter} />
          {/each}
        </section>
      </div>
    {/if}
    {#if $exports.length !== 0}
      <div class="px-4 py-1 w-80">
        <header class="text-primary-500 text-left">
          <strong>Exports added</strong>
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
      <button type="button" class="btn btn-lg-sq variant-ringed-surface">
        <i class="fa-solid fa-chart-pie"></i>
      </button>
      <button type="button" class="btn btn-lg-sq variant-ringed-surface">
        <i class="fa-solid fa-dna"></i>
      </button>
    </div>
  </div>
</section>

<style>
  .btn-lg-sq {
    flex: 50%;
  }
  .btn-lg-sq i {
    font-size: 2.5rem;
    color: rgba(var(--color-primary-500));
  }
</style>