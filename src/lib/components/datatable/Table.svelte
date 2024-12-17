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

  
  
  interface Props {
    // Parameters
    tableName: string;
    search?: boolean;
    title?: string;
    fullWidth?: boolean;
    options?: number[];
    defaultRowsPerPage?: number;
    columns?: Column[];
    cellOverides?: Indexable;
    stickyHeader?: boolean;
    showPagination?: boolean;
    rowClickHandler?: (row: Indexable) => void;
    isClickable?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any; //TODO: Fix this type
    tableActions?: import('svelte').Snippet;
  }

  let {
    tableName,
    search = false,
    title = '',
    fullWidth = false,
    options = [5, 10, 20, 50, 100],
    defaultRowsPerPage = 10,
    columns = [],
    cellOverides = {},
    stickyHeader = false,
    showPagination = true,
    rowClickHandler = () => {},
    isClickable = false,
    data = [],
    tableActions
  }: Props = $props();

  let handler = $derived(new DataHandler(data, { rowsPerPage: defaultRowsPerPage }));
  let rows = $derived(handler.getRows());
</script>

<div class="space-y-1">
  {#if title || search || tableActions}
    <header
      class="flex items-center {title || tableActions
        ? 'justify-between'
        : 'justify-end'} gap-4"
    >
      {#if title}
        <div class="flex-auto">
          <h2 class="my-2">{title}</h2>
        </div>
      {/if}
      {@render tableActions?.()}
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
  .pic-sure-table-compact tbody td:not(.expandable-component) {
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
  }

  table thead th {
    font-weight: normal !important;
  }

  .sticky-header th {
    position: sticky;
    top: 0;
  }
</style>
