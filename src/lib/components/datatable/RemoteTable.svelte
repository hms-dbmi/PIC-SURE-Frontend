<script lang="ts">
  import { TableHandler } from '@vincjo/datatables/server';
  import type { Indexable } from '$lib/types';
  import type { Column } from '$lib/models/Tables';
  import ExpandableRow from '$lib/components/datatable/Row.svelte';
  import ThFilter from '$lib/components/datatable/accessories/Filter.svelte';
  import ThSort from '$lib/components/datatable/accessories/Sort.svelte';
  import RowsPerPage from '$lib/components/datatable/accessories/Rows.svelte';
  import RowCount from '$lib/components/datatable/accessories/Count.svelte';
  import Pagination from '$lib/components/datatable/accessories/Pagination.svelte';
  import Search from '$lib/components/datatable/accessories/Search.svelte';
  import type { Writable } from 'svelte/store';
  import Loading from '../Loading.svelte';

  interface Props {
    tableName?: string;
    handler: TableHandler;
    isLoading: Writable<boolean>;
    searchable?: boolean;
    title?: string;
    fullWidth?: boolean;
    options?: number[];
    columns?: Column[];
    cellOverides?: Indexable;
    rowClickHandler?: (row: Indexable) => void;
    isClickable?: boolean;
    expandable?: boolean;
    tableActions?: import('svelte').Snippet;
  }

  let {
    tableName = 'ExplorerTable',
    handler,
    isLoading,
    searchable = false,
    title = '',
    fullWidth = false,
    options = [5, 10, 20, 50, 100],
    columns = [],
    cellOverides = {},
    rowClickHandler = () => {},
    isClickable = false,
    expandable = false,
    tableActions,
  }: Props = $props();
</script>

<div class="table-wrap space-y-1">
  {#if title || searchable || tableActions}
    <header
      class="flex items-center {title || tableActions ? 'justify-between' : 'justify-end'} gap-4"
    >
      {#if title}
        <div class="flex-auto">
          <h2 class="my-2">{title}</h2>
        </div>
      {/if}
      {@render tableActions?.()}
      {#if searchable}
        <div class="flex-none">
          <Search {handler} />
        </div>
      {/if}
    </header>
  {/if}
  <table
    id="{tableName}-table"
    data-testid="{tableName}-table"
    class="table table-auto align-middle"
    class:w-max={fullWidth}
    class:clickable={isClickable}
  >
    <thead>
      <tr>
        {#each columns as column}
          {#if column.sort}
            <ThSort {handler} orderBy={column.dataElement} class={`bg-primary-300! ${column.class}`}
              >{column.label}</ThSort
            >
          {:else if column.filter}
            <ThFilter {handler} class={column.class} filterBy={column.dataElement} />
          {:else}
            <th class={column.class}>{column.label}</th>
          {/if}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if $isLoading}
        <tr>
          <td colspan={columns.length} class="text-center py-8">
            <div class="flex justify-center items-center">
              <Loading />
            </div>
          </td>
        </tr>
      {:else if handler.rows.length > 0}
        {#each handler.rows as row, i}
          <ExpandableRow
            {tableName}
            {cellOverides}
            {columns}
            index={i}
            {row}
            {rowClickHandler}
            {isClickable}
            {expandable}
          />
        {/each}
      {:else}
        <tr><td colspan={columns.length}>No entries found.</td></tr>
      {/if}
    </tbody>
  </table>
  <footer class="flex justify-between mt-1">
    <RowCount {handler} />
    <div class="flex justify-end gap-4">
      <RowsPerPage {handler} {options} />
      <Pagination {handler} />
    </div>
  </footer>
</div>

<style>
  table thead th {
    font-weight: normal !important;
  }
</style>
