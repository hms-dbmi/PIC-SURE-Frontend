<script lang="ts" generics="T extends Row">
  import { slide } from 'svelte/transition';
  import type { Row } from './types.ts';
  import { getTableContext } from './context.ts';
  import { isFormField } from './keyboard.ts';

  interface Props {
    index: number;
    row: T;
  }

  let { index, row }: Props = $props();

  const table = getTableContext();
  let rowElement: HTMLTableRowElement | undefined = $state();
  let active = $derived(table.isExpanded(row));

  function onKeydown(event: KeyboardEvent) {
    if (!table.clickable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }
    // A held key must not rapid-fire activations (e.g. toggling export on/off).
    if (event.repeat) return;
    if ((event.key === 'Enter' || event.key === ' ') && event.target === rowElement) {
      event.preventDefault();
      table.activate(row);
      return;
    }
    const key = event.key.toLowerCase();
    if (!/^[a-z]$/.test(key) || isFormField(event.target)) return;
    if (table.rowClickKeys.includes(key)) {
      event.preventDefault();
      table.activate(row);
      return;
    }
    const shortcut = rowElement?.querySelector(`[data-key="${key}"]`)?.closest('button, a');
    if (shortcut && !(shortcut instanceof HTMLButtonElement && shortcut.disabled)) {
      event.preventDefault();
      (shortcut as HTMLElement).click();
    }
  }
</script>

<tr
  bind:this={rowElement}
  id="{table.id}-row-{index.toString()}"
  onclick={() => table.activate(row)}
  onkeydown={onKeydown}
  class={table.clickable ? 'cursor-pointer' : ''}
  aria-expanded={table.expandedRow ? active : undefined}
  tabindex={table.tabindex(index)}
>
  {#each table.columns as column, colIndex}
    <td
      id="{table.id}-row-{index.toString()}-col-{colIndex.toString()}"
      class={column?.class?.includes('text-center') ? 'text-center' : ''}
    >
      {#if column.cell}
        {@render column.cell(row)}
      {:else}
        {row[column.dataElement] ? row[column.dataElement] : ''}
      {/if}
    </td>
  {/each}
</tr>

{#if table.expandedRow && active}
  <tr id="{table.id}-active-row-{index.toString()}" class="expandable-row">
    <td colspan={table.columns.length}>
      <div transition:slide={{ axis: 'y' }}>
        {@render table.expandedRow(row)}
      </div>
    </td>
  </tr>
{/if}
