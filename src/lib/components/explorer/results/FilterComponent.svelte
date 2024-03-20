<script lang="ts">
  import type { Filter } from '$lib/models/Filter';
  import { fade, slide } from 'svelte/transition';
  import FilterStore from '$lib/stores/Filter';
  let { updateFilter, removeFilter } = FilterStore;

  export let filter: Filter;
  let open = false;
  let carot = 'fa-caret-up';

  const derivedFilterDescription = function (filter: Filter) {
    if (filter.filterType === 'categorical') {
      if (filter.displayType === 'restrict') {
        return 'Rescricting to ' + filter.values.length + ' values';
      } else if (!filter.displayType) {
        return filter.description;
      }
    } else if (filter.filterType === 'numeric') {
      switch (filter.displayType) {
        case 'between':
          return 'Rescricting to between ' + filter.min + ' and ' + filter.max;
        case 'greaterThan':
          return 'Rescricting to greater than ' + filter.min;
        case 'lessThan':
          return 'Rescricting to less than ' + filter.max;
        default:
          return filter.description;
      }
    } else if (filter.filterType === 'genomic') {
      return filter.description;
    }
  };

  const toggleCardBody = function (e: Event) {
    e.preventDefault();
    e.stopPropagation();
    open = !open;
    carot = open ? 'fa-caret-down' : 'fa-caret-up';
  };

  const editFilter = function () {
    updateFilter(filter);
  };

  const deleteFilter = function () {
    console.log('delete filter', filter.uuid);
    return removeFilter(filter.uuid);
  };
</script>

<div id={filter.uuid} class="flex flex-col card w-full p-1 m-1" transition:fade={{ duration: 300 }}>
  <header class="card-header p-1 flex">
    <div
      class="flex-auto font-bold"
      tabindex="0"
      role="button"
      on:click={toggleCardBody}
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCardBody(e)}
    >
      {filter.variableName}
    </div>
    <div class="actions">
      <button type="button" title="Edit Filter" class="bg-initial text-black-500 hover:text-primary-600" on:click={editFilter}>
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
      <button type="button" title="Remove Filter" class="bg-initial text-black-500 hover:text-primary-600" on:click={deleteFilter}>
        <i class="fa-solid fa-times-circle"></i>
      </button>
      <button type="button" title="See details" class="bg-initial text-black-500 hover:text-primary-600" on:click={toggleCardBody}>
        <i class="fa-solid {carot}"></i>
      </button>
    </div>
  </header>
  {#if open}
    <section class="p-1 whitespace-pre-wrap" transition:slide={{ axis: 'y' }}>
      {derivedFilterDescription(filter)}
      {#if filter.filterType === 'categorical'}
        <div>Values: {filter.values.join(', ')}</div>
      {/if}
    </section>
  {/if}
</div>
