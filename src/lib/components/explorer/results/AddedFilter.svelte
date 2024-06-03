<script lang="ts">
  import type { Filter } from '$lib/models/Filter';
  import { fade, scale, slide } from 'svelte/transition';
  import FilterStore from '$lib/stores/Filter';
  import { elasticInOut } from 'svelte/easing';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import AddFilter from '$lib/components/explorer/AddFilter.svelte';
  let { removeFilter } = FilterStore;
  const modalStore = getModalStore();

  export let filter: Filter;
  let open = false;
  let carot = 'fa-caret-up';

  function editFilter() {
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

  // TODO: Clean up once dictionary is more clear
  const derivedFilterDescription = function (filter: Filter) {
    if (filter.filterType === 'categorical') {
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
        case 'between':
          return `Restricting to between ${filter.min} and ${filter.max}.`;
        case 'greaterThan':
          return `Restricting to greater than ${filter.min}.`;
        case 'lessThan':
          return `Restricting to less than ${filter.max}.`;
        default:
          return filter.description;
      }
    } else if (filter.filterType === 'genomic') {
      const orJoin = (key: string, arr: string[] | undefined) =>
        arr && arr.length > 0 ? `${key}: ${arr.join(', ')}` : undefined;
      return [
        orJoin('Gene with variant', filter.Gene_with_variant),
        orJoin('Variant frequency', filter.Variant_frequency_as_text),
        orJoin('Consequence Group by severity', filter.Variant_consequence_calculated),
      ]
        .filter((x) => x)
        .join('; ');
    }
  };

  const toggleCardBody = function () {
    open = !open;
    carot = open ? 'fa-caret-down' : 'fa-caret-up';
  };

  const deleteFilter = function () {
    console.log('delete filter', filter.uuid);
    return removeFilter(filter.uuid);
  };
</script>

<div
  id={filter.uuid}
  class="flex flex-col card p-1 m-1"
  in:scale={{ easing: elasticInOut }}
  out:fade={{ duration: 300 }}
  data-testid="added-filter-{filter.variableName}"
>
  <header class="card-header p-1 flex">
    <div
      class="flex-auto font-bold"
      tabindex="0"
      role="button"
      on:click|preventDefault|stopPropagation={toggleCardBody}
      on:keydown|preventDefault|stopPropagation={(e) =>
        (e.key === 'Enter' || e.key === ' ') && toggleCardBody}
    >
      {filter.variableName}
    </div>
    <div class="actions">
      {#if filter.filterType !== 'genomic'}
        <button
          type="button"
          title="Edit Filter"
          class="bg-initial text-black-500 hover:text-primary-600"
          on:click={editFilter}
        >
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      {/if}
      <button
        type="button"
        title="Remove Filter"
        class="bg-initial text-black-500 hover:text-primary-600"
        on:click={deleteFilter}
      >
        <i class="fa-solid fa-times-circle"></i>
      </button>
      <button
        type="button"
        title="See details"
        class="bg-initial text-black-500 hover:text-primary-600"
        on:click={toggleCardBody}
      >
        <i class="fa-solid {carot}"></i>
      </button>
    </div>
  </header>
  {#if open}
    <section class="p-1 whitespace-pre-wrap" transition:slide={{ axis: 'y' }}>
      {derivedFilterDescription(filter)}
      {#if filter.filterType === 'categorical' && filter.displayType !== 'any' && filter.displayType !== 'anyRecordOf'}
        <div>Values: {filter.categoryValues.join(', ')}</div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .actions {
    flex: none;
  }
</style>
