<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { Column } from '$lib/models/Tables';
  import type { Indexable } from '$lib/types';
  import {
    activeTable,
    activeRow,
    expandableComponents,
    activeComponent,
    setActiveRow,
  } from '$lib/stores/ExpandableRow';

  interface Props {
    cellOverides?: Indexable;
    columns?: Column[];
    index?: number;
    row?: Indexable;
    tableName?: string;
    isClickable?: boolean;
    rowClickHandler?: (row: Indexable) => void;
  }

  let {
    cellOverides = {},
    columns = [],
    index = -2,
    row = {},
    tableName = '',
    isClickable = false,
    rowClickHandler = () => {},
  }: Props = $props();

  function onClick(row: Indexable) {
    setActiveRow({ row: row.conceptPath || row.dataset_id, table: tableName });
    rowClickHandler(row);
  }
  let active = $derived(
    $activeTable === tableName &&
      ($activeRow === row?.conceptPath || $activeRow === row.dataset_id),
  );
</script>

<tr
  id="row-{index.toString()}"
  onclick={() => onClick(row)}
  class={isClickable ? 'cursor-pointer' : ''}
  tabindex={isClickable ? 0 : -1}
>
  {#each columns as column, colIndex}
    <td
      id="row-{index.toString()}-col-{colIndex.toString()}"
      class={column?.class?.includes('text-center') ? 'text-center' : ''}
    >
      {#if cellOverides[column.dataElement]}
        {@const SvelteComponent = cellOverides[column.dataElement]}
        <SvelteComponent data={{ index, row, cell: row[column.dataElement] }} />
      {:else}
        {row[column.dataElement] ? row[column.dataElement] : ''}
      {/if}
    </td>
  {/each}
</tr>

{#if active && Object.keys($expandableComponents).length > 0}
  <tr id="active-row-{index.toString()}" class="expandable-row">
    <td colspan={columns.length}>
      <div transition:slide={{ axis: 'y' }}>
        {#if $activeComponent}
          {@const SvelteComponent_1 = $activeComponent}
          <SvelteComponent_1 data={row} />
        {/if}
      </div>
    </td>
  </tr>
{/if}
