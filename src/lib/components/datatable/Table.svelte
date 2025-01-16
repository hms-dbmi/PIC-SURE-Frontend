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
  export let tableName: string;
  export let search = false;
  export let title = '';
  export let fullWidth: boolean = false;
  export let options: number[] = [5, 10, 20, 50, 100];
  export let defaultRowsPerPage = 10;
  export let columns: Column[] = [];
  export let cellOverides: Indexable = {};
  export let stickyHeader = false;
  export let showPagination = true;
  export let rowClickHandler: (row: Indexable) => void = () => {};
  export let isClickable: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let data: any = []; //TODO: Fix this type

  $: handler = new DataHandler(data, { rowsPerPage: defaultRowsPerPage });
  $: rows = handler.getRows();
</script>

<div class="space-y-1">
  {#if title || search || $$slots.tableActions}
    <header
      class="flex items-center {title || $$slots.tableActions
        ? 'justify-between'
        : 'justify-end'} gap-4"
    >
      {#if title}
        <div class="flex-auto">
          <h2 class="my-2">{title}</h2>
        </div>
      {/if}
      <slot name="tableActions" />
      {#if search}
        <div class="flex-none">
          <Search {handler} />
        </div>
      {/if}
    </header>
  {/if}
  <div class="overflow-x-auto">
    <table
      id="{tableName}-table"
      data-testid="{tableName}-table"
      class="table table-auto table-hover align-middle {fullWidth ? 'w-max' : ''}"
    >
      <thead>
        <tr class={stickyHeader ? 'sticky-header' : ''}>
          {#each columns as column}
            {#if column.sort}
              <ThSort
                {handler}
                class={`bg-primary-300 ${column.class}`}
                orderBy={column.dataElement}
              >
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
            <ExpandableRow
              {tableName}
              {cellOverides}
              {columns}
              index={i}
              {row}
              {rowClickHandler}
              {isClickable}
            />
          {/each}
        {:else}
          <tr><td colspan={columns.length}>No entries found.</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
  <footer class="flex justify-between">
    <RowCount {handler} />
    {#if showPagination}
      <div class="flex justify-end gap-4">
        <RowsPerPage {options} {handler} />
        <Pagination {handler} />
      </div>
    {/if}
  </footer>
</div>

<style>
  table thead th {
    font-weight: normal !important;
  }

  .sticky-header th {
    position: sticky;
    top: 0;
  }
</style>
