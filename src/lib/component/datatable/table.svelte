<script lang="ts">
  import { DataHandler } from '@vincjo/datatables';

  import ThSort from './accessories/sort.svelte';
  import ThFilter from './accessories/filter.svelte';
  import Search from './accessories/search.svelte';
  import RowsPerPage from './accessories/rows.svelte';
  import RowCount from './accessories/count.svelte';
  import Pagination from './accessories/pagination.svelte';
  import type { Indexable } from '$lib/types';

  interface Column {
    dataElement: string;
    label: string;
  }

  // Parameters
  export let filter = false;
  export let search = false;
  export let sort = false;
  export let defaultRowsPerPage = 5;
  export let columns: Column[] = [];
  export let cellOverides: Indexable = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let data: any = [];

  $: handler = new DataHandler(data, { rowsPerPage: defaultRowsPerPage });
  $: rows = handler.getRows();
</script>

<div class="overflow-x-auto space-y-4">
  {#if search}
    <header class="flex justify-between gap-4">
      <Search {handler} />
    </header>
  {/if}
  <table class="table table-hover table-compact w-full table-auto align-middle">
    <thead>
      {#if sort}
        <tr>
          {#each columns as column}
            <ThSort {handler} orderBy={column.dataElement}>{column.label}</ThSort>
          {/each}
        </tr>
      {:else}
        <tr>
          {#each columns as column}
            <th>{column.label}</th>
          {/each}
        </tr>
      {/if}
      {#if filter}
        <tr>
          {#each columns as column}
            <ThFilter {handler} filterBy={column.dataElement} />
          {/each}
        </tr>
      {/if}
    </thead>
    <tbody>
      {#if $rows.length > 0}
        {#each $rows as row}
          <tr>
            {#each columns as column}
              <td>
                {#if cellOverides[column.dataElement]}
                  <svelte:component
                    this={cellOverides[column.dataElement]}
                    data={{ row, cell: row[column.dataElement] }}
                  />
                {:else}
                  {row[column.dataElement]}
                {/if}
              </td>
            {/each}
          </tr>
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
