<script lang="ts">
  import { DataHandler } from '@vincjo/datatables';

  import ThSort from './accessories/Sort.svelte';
  import ThFilter from './accessories/Filter.svelte';
  import Search from './accessories/Search.svelte';
  import RowsPerPage from './accessories/Rows.svelte';
  import RowCount from './accessories/Count.svelte';
  import Pagination from './accessories/Pagination.svelte';
  import type { Indexable } from '$lib/types';
  import type { Column } from '$lib/models/Tables';
  import ExpandableRow from '$lib/components/datatable/Row.svelte';

  // Parameters
  export let search = false;
  export let title = '';
  export let defaultRowsPerPage = 5;
  export let columns: Column[] = [];
  export let cellOverides: Indexable = {};
  export let rowClickHandler: (index: number) => void = () => {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let data: any = []; //TODO: Fix this type

  $: handler = new DataHandler(data, { rowsPerPage: defaultRowsPerPage });
  $: rows = handler.getRows();
</script>

<div class="overflow-x-auto space-y-4">
  {#if title || search}
    <header class="flex justify-between gap-4">
      {#if title}
        <div class="flex-auto">
          <h2>{title}</h2>
        </div>
      {/if}
      {#if search}
        <div class="flex-none">
          <Search {handler} />
        </div>
      {/if}
    </header>
  {/if}
  <table class="table table-hover table-compact w-full table-auto align-middle">
    <thead>
      <tr>
        {#each columns as column}
          {#if column.sort}
            <ThSort {handler} class={`bg-primary-300 ${column.class}`} orderBy={column.dataElement}>
              {column.label}
            </ThSort>
          {:else if column.filter}
            <ThFilter
              {handler}
              class={`bg-primary-300 ${column.class}`}
              filterBy={column.dataElement}
            />
          {:else}
            <th class={`bg-primary-300 ${column.class}`}>{column.label}</th>
          {/if}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if $rows.length > 0}
        {#each $rows as row, i}
          <ExpandableRow {cellOverides} {columns} index={i} {row} {rowClickHandler} />
        {/each}
      {:else}
        <tr><td colspan={columns.length}>No entries found.</td></tr>
      {/if}
    </tbody>
  </table>
  <footer class="flex justify-between">
    <RowCount {handler} />
    <div class="flex justify-end gap-4">
      <RowsPerPage {handler} />
      <Pagination {handler} />
    </div>
  </footer>
</div>

<style>
  .pic-sure-table-compact tbody td:not(.expandable-component) {
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
  }
</style>
