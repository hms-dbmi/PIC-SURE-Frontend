<script lang="ts">
  import { DataHandler, Search, Th } from '@vincjo/datatables/remote';
  import { onMount } from 'svelte';
  import { setComponentRegistry } from '$lib/stores/ExpandableRow';
  import type { Indexable } from '$lib/types';
  import type { Column } from '$lib/models/Tables';
  import ExpandableRow from '$lib/components/datatable/Row.svelte';
  import AddFilterComponent from '$lib/components/explorer/AddFilter.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import ThFilter from '$lib/components/datatable/accessories/Filter.svelte';
  import RowsPerPage from '$lib/components/datatable/accessories/Rows.svelte';
  import RowCount from '$lib/components/datatable/accessories/Count.svelte';
  import Pagination from '$lib/components/datatable/accessories/Pagination.svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import type { Writable } from 'svelte/store';

  interface Props {
    tableName?: string;
    handler: DataHandler;
    isLoading: Writable<boolean>;
    searchable?: boolean;
    title?: string;
    fullWidth?: boolean;
    options?: number[];
    columns?: Column[];
    cellOverides?: Indexable;
    rowClickHandler?: (row: Indexable) => void;
    isClickable?: boolean;
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
    tableActions,
  }: Props = $props();
  let rows = handler.getRows();

  onMount(() => {
    setComponentRegistry(
      {
        filter: AddFilterComponent,
        info: ResultInfoComponent,
        hierarchy: HierarchyComponent,
      },
      'info',
      tableName,
    );

    return () => {
      setComponentRegistry({});
    };
  });
</script>

<div class="space-y-1">
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
    class="table table-auto table-hover align-middle {fullWidth ? 'w-max' : ''}"
  >
    <thead style="border-color: revert;">
      <tr>
        {#each columns as column}
          {#if column.sort}
            <Th {handler} orderBy={column.dataElement} class={`!bg-primary-300 ${column.class}`}
              >{column.label}</Th
            >
          {:else if column.filter}
            <ThFilter
              {handler}
              class={`!bg-primary-300 ${column.class}`}
              filterBy={column.dataElement}
            />
          {:else}
            <th class={`bg-primary-300 ${column.class}`}>{column.label}</th>
          {/if}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if $isLoading}
        <tr>
          <td colspan={columns.length} class="text-center py-8">
            <div class="flex justify-center items-center">
              <ProgressRadial width="w-12" />
            </div>
          </td>
        </tr>
      {:else if $rows.length > 0}
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
