<script lang="ts">
  import { elasticInOut } from 'svelte/easing';
  import { fade, scale, slide } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { Option } from '#lib/query/genomic.ts';
  import {
    type Filter,
    type AnyRecordOfFilterInterface,
    describeFilter,
    studyLabel,
  } from '#lib/query/filter.svelte.ts';
  import { removeFilter, activeFilter, activeSearch } from '#lib/query/filters.ts';
  import { populateFromGeneFilter } from '#lib/query/GeneFilter.ts';
  import { populateFromSNPFilter } from '#lib/query/SNPFilter.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import AddFilter from '#lib/explorer/components/AddFilter.svelte';
  import ViewAnyRecordOfFilter from '#lib/explorer/components/ViewAnyRecordOfFilter.svelte';
  import { cardClass } from '#lib/ui/surface.ts';

  let { filter }: { filter: Filter } = $props();
  let open = $state(false);
  let carot = $state('fa-caret-up');
  const genomicFilter = $derived(['genomic', 'snp'].includes(filter.filterType));
  const anyRecordOfFilter = $derived(filter.filterType === 'AnyRecordOf');
  let filterModal: boolean = $state(false);
  let anyRecordOfModal: boolean = $state(false);

  function logEditClick() {
    log(createLog('ACTION', 'filter.edit_click', { variable: filter.variableName }));
  }

  function editFilter() {
    logEditClick();
    if (filter.filterType === 'genomic') {
      populateFromGeneFilter(filter);
      goto(resolve(`explorer/genome-filter?edit=${Option.Genomic}`));
    } else if (filter.filterType === 'snp') {
      populateFromSNPFilter(filter);
      goto(resolve(`explorer/genome-filter?edit=${Option.SNP}`));
    } else {
      $activeFilter = filter;
      $activeSearch = filter.searchResult;
    }
  }

  const toggleCardBody = function (event: Event) {
    event.stopPropagation();
    event.preventDefault();
    open = !open;
    carot = open ? 'fa-caret-down' : 'fa-caret-up';
    if (open) log(createLog('ACTION', 'filter.view_details', { variable: filter.variableName }));
  };

  const deleteFilter = function () {
    return removeFilter(filter.uuid);
  };
</script>

<div
  class="flex flex-col {cardClass} bg-surface-100 p-1 m-1"
  in:scale={{ easing: elasticInOut }}
  out:fade={{ duration: 300 }}
  data-testid="results-filter-item-{filter.id}"
>
  <header class="card-header p-1 flex">
    {#if !anyRecordOfFilter}
      <div
        class="flex-auto variable"
        tabindex="0"
        role="button"
        onclick={toggleCardBody}
        onkeydown={(e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && toggleCardBody(e)}
      >
        {filter.variableName}
      </div>
    {:else}
      <Dialog
        bind:open={anyRecordOfModal}
        title="View Variables in Filter"
        data-testid={`results-filter-any-record-of-${filter.id}`}
      >
        {#snippet trigger()}
          <div class="text-left">
            {(filter as AnyRecordOfFilterInterface)?.concepts?.length} variable(s) in {filter
              .searchResult?.display ||
              filter.searchResult?.name ||
              filter.variableName}
            category
          </div>
        {/snippet}
        <ViewAnyRecordOfFilter {filter} />
      </Dialog>
    {/if}
    <div class="actions">
      {#if genomicFilter}
        <button
          type="button"
          title="Edit Filter"
          class="hover:text-primary-600"
          onclick={editFilter}
        >
          <i class="fa-solid fa-pen-to-square"></i>
          <span class="sr-only">Edit Filter</span>
        </button>
      {:else if !anyRecordOfFilter}
        <Dialog
          bind:open={filterModal}
          title="Edit Filter"
          triggerClass="hover:text-primary-600"
          ontrigger={logEditClick}
        >
          {#snippet trigger()}
            <i class="fa-solid fa-pen-to-square"></i>
            <span class="sr-only">Edit Filter</span>
          {/snippet}
          <AddFilter
            data={filter.searchResult}
            existingFilter={filter}
            onclose={() => (filterModal = false)}
          />
        </Dialog>
      {/if}
      <button
        type="button"
        title="Remove Filter"
        class="hover:text-primary-600"
        onclick={deleteFilter}
      >
        <i class="fa-solid fa-times-circle"></i>
        <span class="sr-only">Remove Filter</span>
      </button>
      {#if !anyRecordOfFilter}
        <button
          type="button"
          title="See details"
          class="hover:text-primary-600"
          onclick={toggleCardBody}
        >
          <i class="fa-solid {carot}"></i>
          <span class="sr-only">See details</span>
        </button>
      {/if}
    </div>
  </header>
  {#if open}
    <section class="p-1 whitespace-pre-wrap" transition:slide={{ axis: 'y' }}>
      {describeFilter(filter)}
      {studyLabel(filter.searchResult)}
      {#if filter.filterType === 'Categorical' && filter.displayType !== 'any' && filter.displayType !== 'anyRecordOf'}
        <div>Values: {filter.categoryValues.join(', ')}</div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .actions {
    flex: none;
  }
  .card-header .variable {
    overflow-wrap: break-word;
    overflow: auto;
  }
</style>
