<script lang="ts">
  import type { Column } from '$lib/models/Tables';
  import type { Indexable } from '$lib/types';
  import {
    activeTable,
    activeRow,
    expandableComponents,
    activeComponent,
    setActiveRow,
  } from '$lib/stores/ExpandableRow';

  export let cellOverides: Indexable = {};
  export let columns: Column[] = [];
  export let index: number = -2;
  export let row: Indexable = {};
  export let tableName: string = '';
  export let rowClickHandler: (row: Indexable) => void = () => {};

  function onClick(row: Indexable) {
    setActiveRow({ row: row.id, table: tableName });
    rowClickHandler(row);
  }
  $: active = $activeTable === tableName && $activeRow === row?.id;
</script>

<tr id={index.toString()} on:click|stopPropagation={() => onClick(row)} class="cursor-pointer">
  {#each columns as column}
    <td>
      {#if cellOverides[column.dataElement]}
        <svelte:component
          this={cellOverides[column.dataElement]}
          data={{ index, row, cell: row[column.dataElement] }}
        />
      {:else}
        {row[column.dataElement]}
      {/if}
    </td>
  {/each}
</tr>

{#if active && Object.keys($expandableComponents).length > 0}
  <tr class="expandable-row">
    <td colspan={columns.length}>
      {#if $activeComponent}
        <svelte:component this={$activeComponent} data={row} />
      {/if}
    </td>
  </tr>
{/if}

<style>
  .expandable-row {
    background-color: rgb(var(--color-surface-300)) !important;
  }
</style>
