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
  interface Props {
    tableName: string;
    search?: boolean;
    title?: string;
    fullWidth?: boolean;
    tableAuto?: boolean;
    options?: number[];
    defaultRowsPerPage?: number;
    columns?: Column[];
    cellOverides?: Indexable;
    stickyHeader?: boolean;
    showPagination?: boolean;
    isClickable?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    class?: string;
    rowClickHandler?: (row: Indexable) => void;
    tableActions?: import('svelte').Snippet;
  }

  const {
    tableName,
    search = false,
    title = '',
    fullWidth = false,
    tableAuto = true,
    options = [5, 10, 20, 50, 100],
    defaultRowsPerPage = 10,
    columns = [],
    cellOverides = {},
    stickyHeader = false,
    showPagination = true,
    isClickable = false,
    data = [],
    class: className = '',
    rowClickHandler = () => {},
    tableActions,
  }: Props = $props();

  const handler = new DataHandler(data, { rowsPerPage: defaultRowsPerPage });
  let rows = $derived(handler.getRows());
</script>

<div class="space-y-1">
  {#if title || search || tableActions}
    <header
      class="flex items-center {title || tableActions ? 'justify-between' : 'justify-end'} gap-4"
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
      class="table table-{tableAuto ? 'auto' : 'fixed'} table-hover align-middle
        {fullWidth ? 'w-max' : ''} {className}"
    >
      <thead>
        <tr class={stickyHeader ? 'sticky-header' : ''}>
          {#each columns as column}
            {#if column.sort}
              <ThSort
                {handler}
                class={`bg-primary-300 ${column.class ?? ''}`}
                orderBy={column.dataElement}
              >
                {column.label}
              </ThSort>
            {:else if column.filter}
              <ThFilter
                {handler}
                class={`bg-primary-300 ${column.class ?? ''}`}
                filterBy={column.dataElement}
              />
            {:else}
              <th class={`bg-primary-300 ${column.class ?? ''}`}>{column.label}</th>
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
