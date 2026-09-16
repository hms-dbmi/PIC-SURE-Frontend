<script lang="ts">
  import type { Column } from '$lib/components/datatable/types';
  import type { Indexable } from '$lib/types';
  import { isFormField, tableIdPrefix } from '$lib/components/datatable/keyboard';
  import { log, createLog, getPageContext } from '$lib/logger';

  interface Props {
    cellOverides?: Indexable;
    columns?: Column[];
    index?: number;
    row?: Indexable;
    tableName?: string;
    isClickable?: boolean;
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
    isClickable = false,
    rowClickHandler = () => {},
    rowClickKeys = [],
    rowClickLogAction,
    tabindex = isClickable ? 0 : -1,
  }: Props = $props();

  let rowElement: HTMLTableRowElement | undefined = $state();

  // Element ids must be page-unique (multiple tables can render together).
  const idPrefix = $derived(tableIdPrefix(tableName));

  function onClick(row: Indexable) {
    if (rowClickLogAction) {
      log(
        createLog('ACTION', rowClickLogAction, {
          variable: row.conceptPath || row.dataset_id,
          pageContext: getPageContext(),
        }),
      );
    }
    rowClickHandler(row);
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isClickable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    // A held key must not rapid-fire activations.
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
  id="{idPrefix}-row-{index.toString()}"
  onclick={() => onClick(row)}
  onkeydown={onKeydown}
  class={isClickable ? 'cursor-pointer' : ''}
  {tabindex}
>
  {#each columns as column, colIndex}
    <td
      id="{idPrefix}-row-{index.toString()}-col-{colIndex.toString()}"
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
