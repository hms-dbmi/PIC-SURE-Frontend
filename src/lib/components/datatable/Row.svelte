<script lang="ts">
  import type { Column } from '$lib/models/Tables';
  import type { Indexable } from '$lib/types';
  import { activeRow, expandableComponents, activeComponent } from '$lib/stores/ExpandableRow';

  export let cellOverides: Indexable = {};
  export let columns: Column[] = [];
  export let index: number = -2;
  export let row: Indexable = {};
  export let rowClickHandler: (index: number, row?: Indexable) => void;

  function onClick(index: number, row: Indexable) {
    if (index === undefined || index === null || index < 0) return;
    rowClickHandler && rowClickHandler(index, row);
  }
</script>

<tr
  id={index.toString()}
  on:click|stopPropagation={() => onClick(index, row)}
  class="cursor-pointer"
>
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

{#if Object.keys($expandableComponents).length > 0 && $activeRow === index}
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
