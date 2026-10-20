<script lang="ts">
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import type { Indexable } from '#lib/utils/objects.ts';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
  import { isFormField } from '#lib/ui/datatable/keyboard.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  interface Props {
    cellOverides?: Indexable;
    columns?: Column[];
    index?: number;
    row?: Indexable;
    tableName?: string;
    tableId: string;
    isClickable?: boolean;
    expandedRow?: Snippet<[Indexable]>;
    rowClickHandler?: (row: Indexable) => void;
    rowClickKeys?: string[];
    rowClickLogAction?: string;
    tabindex?: number;
  }

  let {
    cellOverides = {},
    columns = [],
    index = -2,
    row = {},
    tableName = '',
    tableId,
    isClickable = false,
    expandedRow,
    rowClickHandler = () => {},
    rowClickKeys = [],
    rowClickLogAction,
    tabindex = isClickable ? 0 : -1,
  }: Props = $props();

  let rowElement: HTMLTableRowElement | undefined = $state();

  let rowKey = $derived(row.conceptPath || row.dataset_id);
  let active = $derived(explorerPanel.isExpanded(tableName, rowKey));

  function onClick(row: Indexable) {
    if (rowClickLogAction) {
      log(
        createLog('ACTION', rowClickLogAction, {
          variable: rowKey,
          open: !active,
          pageContext: getPageContext(),
        }),
      );
    }
    explorerPanel.toggleRow(rowKey, { table: tableName });
    rowClickHandler(row);
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isClickable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    // A held key must not rapid-fire activations (e.g. toggling export on/off).
    if (event.repeat) return;
    if ((event.key === 'Enter' || event.key === ' ') && event.target === rowElement) {
      event.preventDefault();
      onClick(row);
      return;
    }
    const key = event.key.toLowerCase();
    if (!/^[a-z]$/.test(key) || isFormField(event.target)) return;
    if (rowClickKeys.includes(key)) {
      event.preventDefault();
      onClick(row);
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
  id="{tableId}-row-{index.toString()}"
  onclick={() => onClick(row)}
  onkeydown={onKeydown}
  class={isClickable ? 'cursor-pointer' : ''}
  aria-expanded={expandedRow ? active : undefined}
  {tabindex}
>
  {#each columns as column, colIndex}
    <td
      id="{tableId}-row-{index.toString()}-col-{colIndex.toString()}"
      class={column?.class?.includes('text-center') ? 'text-center' : ''}
    >
      {#if cellOverides[column.dataElement]}
        {@const SvelteComponent = cellOverides[column.dataElement]}
        <SvelteComponent data={{ tableName, index, row, cell: row[column.dataElement] }} />
      {:else}
        {row[column.dataElement] ? row[column.dataElement] : ''}
      {/if}
    </td>
  {/each}
</tr>

{#if expandedRow && active}
  <tr id="{tableId}-active-row-{index.toString()}" class="expandable-row">
    <td colspan={columns.length}>
      <div transition:slide={{ axis: 'y' }}>
        {@render expandedRow(row)}
      </div>
    </td>
  </tr>
{/if}
