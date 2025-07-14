<script lang="ts">
  import { check, TableHandler, type FilterBuilder } from '@vincjo/datatables';

  import type { Column } from '$lib/components/datatable/types';

  import Modal from '$lib/components/Modal.svelte';

  const DEFAULT_CHECK = 'isLike';

  interface Filterable {
    field: string;
    value?: string | number;
    altValue?: string | number;
    label: string;
    check: string;
    dirty: boolean;
    filter: FilterBuilder<any>;
  }

  let {
    filterColumns,
    handler,
  }: {
    filterColumns: Column[];
    handler: TableHandler;
  } = $props();

  let filters: Filterable[] = $state([]);
  let modalOpen = $state(false);
  let selectable = $derived(
    filterColumns.filter(({ dataElement }) => !filters.find(({ field }) => field === dataElement)),
  );
  let addFilter: string = $state('');

  function addFilterable() {
    filters.push({
      field: addFilter,
      label: filterColumns.find(({ dataElement }) => addFilter === dataElement)?.label || '',
      check: DEFAULT_CHECK,
      dirty: true,
      filter: handler.createFilter(addFilter),
    });
    addFilter = '';
  }

  function saveFilter(filterable: Filterable) {
    return () => {
      filterable.filter = handler.createFilter(filterable.field, check[filterable.check]);
      if (filterable.check === 'isBetween') {
        filterable.filter.value = [filterable.value, filterable.altValue];
      } else {
        filterable.filter.value = filterable.value;
      }
      filterable.filter.set();
      filterable.dirty = false;
    };
  }

  function deleteFilter(filterable: Filterable) {
    return () => {
      filterable.filter.value = '';
      filterable.filter.clear();
      filters = filters.filter(({ field }) => filterable.field !== field);
    };
  }

  function saveFilters() {
    filters = filters.filter(({ value }) => value !== undefined);
    filters.forEach((filterable) => saveFilter(filterable)());
    modalOpen = false;
  }

  function clearFilters() {
    filters.forEach((filterable) => deleteFilter(filterable)());
    modalOpen = false;
  }

  // $inspect('filters', filters);
</script>

<Modal
  bind:open={modalOpen}
  width="w-2/3"
  cancelText="Close"
  triggerBase="btn-icon border border-surface-200 hover:preset-filled-primary-500"
>
  {#snippet trigger()}
    <i class="fa-solid fa-filter"></i>
    <span class="sr-only">Filter</span>
  {/snippet}
  <fieldset class="flex items-center gap-2 w-full h-full">
    <select name="add-filter" class="flex-auto select" placeholder="Select" bind:value={addFilter}>
      <option disabled selected value="">Add Column Filter...</option>
      {#each selectable as column}
        <option value={column.dataElement}>{column.label}</option>
      {/each}
    </select>
    <button
      class="flex-none btn-icon border border-surface-200 hover:preset-filled-primary-500"
      onclick={addFilterable}
    >
      <i class="fa-solid fa-plus"></i>
      <span class="sr-only">Add Filter</span>
    </button>
  </fieldset>
  {#if filters.length > 0}
    {#each filters as filterable}
      <fieldset class="flex items-center gap-2 w-full h-full">
        <div class="flex-grow"><span class="font-bold">{filterable.label}</span> is:</div>
        <select
          name="comparator"
          class="flex-none !w-48 select"
          placeholder="Select"
          bind:value={filterable.check}
          onchange={() => (filterable.dirty = true)}
        >
          <option value="isLike">Like</option>
          <option value="isNotLike">Not Like</option>
          <option value="startsWith">Starts With</option>
          <option value="endsWith">Ends With</option>
          <option value="isEqualTo">Equal To</option>
          <option value="isNotEqualTo">Not Equal To</option>
          <option value="isGreaterThan">Greater Than</option>
          <option value="isGreaterThanOrEqualTo">Greater or Equal</option>
          <option value="isLessThan">Less Than</option>
          <option value="isLessThanOrEqualTo">Less or Equal</option>
          <option value="isBetween">Between</option>
          <option value="isTrue">True</option>
          <option value="isFalse">False</option>
          <option value="isNull">Null</option>
          <option value="isNotNull">Not Null</option>
        </select>
        {#if filterable.check === 'isBetween'}
          <input
            class="input !w-40"
            name="value"
            type="text"
            bind:value={filterable.value}
            onchange={() => (filterable.dirty = true)}
          />
          and
          <input
            class="input !w-40"
            name="altValue"
            type="text"
            bind:value={filterable.altValue}
            onchange={() => (filterable.dirty = true)}
          />
        {:else if !['isTrue', 'isFalse', 'isNull', 'isNotNull'].includes(filterable.check)}
          <input
            class="input !w-40"
            name="value"
            type="text"
            bind:value={filterable.value}
            onchange={() => (filterable.dirty = true)}
          />
        {/if}
        <button disabled={!filterable.dirty} onclick={saveFilter(filterable)}>
          <i class="fa-solid fa-floppy-disk"></i>
          <span class="sr-only">Save</span>
        </button>
        <button onclick={deleteFilter(filterable)}>
          <i class="fa-solid fa-trash"></i>
          <span class="sr-only">Delete</span>
        </button>
      </fieldset>
    {/each}
  {/if}
  <footer class="modal-footer flex justify-end space-x-2 mt-6">
    {#if filters.length > 0}
      <button
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={saveFilters}
      >
        Save Filters
      </button>
      <button
        class="btn border preset-tonal-error hover:preset-filled-error-500"
        onclick={clearFilters}
      >
        Clear All Filters
      </button>
    {:else}
      <button
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={clearFilters}
      >
        Close
      </button>
    {/if}
  </footer>
</Modal>
