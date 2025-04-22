<script lang="ts">
  import { elasticInOut } from 'svelte/easing';
  import { fade, scale, slide } from 'svelte/transition';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';

  import { goto } from '$app/navigation';

  import { Option } from '$lib/models/GenomeFilter';
  import type { Filter } from '$lib/models/Filter';
  import { removeFilter } from '$lib/stores/Filter';
  import { populateFromGeneFilter } from '$lib/stores/GeneFilter';
  import { populateFromSNPFilter } from '$lib/stores/SNPFilter';

  import AddFilter from '$lib/components/explorer/AddFilter.svelte';

  const modalStore = getModalStore();

  interface Props {
    filter: Filter;
  }

  let { filter }: Props = $props();
  let open = $state(false);
  let carot = $state('fa-caret-up');

  function editFilter() {
    if (filter.filterType === 'genomic') {
      populateFromGeneFilter(filter);
      goto('/explorer/genome-filter?edit=' + Option.Genomic);
    } else if (filter.filterType === 'snp') {
      populateFromSNPFilter(filter);
      goto('/explorer/genome-filter?edit=' + Option.SNP);
    } else {
      const modal: ModalSettings = {
        type: 'component',
        title: 'Edit Filter',
        component: 'modalWrapper',
        modalClasses: 'bg-surface-100-800-token p-4 block',
        meta: { existingFilter: filter, component: AddFilter },
        response: (r: string) => {
          console.log(r);
        },
      };
      modalStore.trigger(modal);
    }
  }

  // TODO: Clean up once dictionary is more clear
  const derivedFilterDescription = function (filter: Filter) {
    if (filter.filterType === 'Categorical') {
      if (filter.displayType === 'restrict') {
        let valueText = filter.categoryValues.length === 1 ? 'value' : 'values';
        return `Restricting to ${filter.categoryValues.length} ${valueText}.`;
      } else if (filter.displayType === 'any' || filter.displayType === 'anyRecordOf') {
        return 'Restricting to any value.';
      } else {
        return filter.description;
      }
    } else if (filter.filterType === 'numeric') {
      switch (filter.displayType) {
        case 'any':
          return 'Restricting to any value.';
        case 'between':
          return `Restricting to between ${filter.min} and ${filter.max}.`;
        case 'greaterThan':
          return `Restricting to greater than ${filter.min}.`;
        case 'lessThan':
          return `Restricting to less than ${filter.max}.`;
        default:
          return filter.description || 'N/A';
      }
    } else if (filter.filterType === 'genomic' || filter.filterType === 'snp') {
      return filter.description;
    }
  };

  const derivedStudyDescription = function (filter: Filter) {
    if (filter.searchResult?.studyAcronym && filter.searchResult?.dataset) {
      return `${filter.searchResult.studyAcronym} (${filter.searchResult.dataset})`;
    }
    return filter.searchResult?.studyAcronym || filter.searchResult?.dataset || '';
  };

  const toggleCardBody = function (event: Event) {
    event.stopPropagation();
    event.preventDefault();
    open = !open;
    carot = open ? 'fa-caret-down' : 'fa-caret-up';
  };

  const deleteFilter = function () {
    return removeFilter(filter.uuid);
  };
</script>

<div
  id={filter.uuid}
  class="flex flex-col card p-1 m-1"
  in:scale={{ easing: elasticInOut }}
  out:fade={{ duration: 300 }}
  data-testid="added-filter-{filter.id}"
>
  <header class="card-header p-1 flex">
    <div
      class="flex-auto variable"
      tabindex="0"
      role="button"
      onclick={toggleCardBody}
      onkeydown={(e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && toggleCardBody(e)}
    >
      {filter.variableName}
    </div>
    <div class="actions">
      <button
        type="button"
        title="Edit Filter"
        class="bg-initial text-black-500 hover:text-primary-600"
        onclick={editFilter}
      >
        <i class="fa-solid fa-pen-to-square"></i>
        <span class="sr-only">Edit Filter</span>
      </button>
      <button
        type="button"
        title="Remove Filter"
        class="bg-initial text-black-500 hover:text-primary-600"
        onclick={deleteFilter}
      >
        <i class="fa-solid fa-times-circle"></i>
        <span class="sr-only">Remove Filter</span>
      </button>
      <button
        type="button"
        title="See details"
        class="bg-initial text-black-500 hover:text-primary-600"
        onclick={toggleCardBody}
      >
        <i class="fa-solid {carot}"></i>
        <span class="sr-only">See details</span>
      </button>
    </div>
  </header>
  {#if open}
    <section class="p-1 whitespace-pre-wrap" transition:slide={{ axis: 'y' }}>
      {derivedFilterDescription(filter)}
      {derivedStudyDescription(filter)}
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
