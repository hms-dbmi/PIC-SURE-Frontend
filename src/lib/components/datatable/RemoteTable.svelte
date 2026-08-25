<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';

  import type { TableProps } from './types';

  import { activeTable, activeRow, closeActiveRow } from '$lib/stores/ExpandableRow';
  import { isFormField, isTextEntryField } from '$lib/components/datatable/keyboard';
  import { log, createLog } from '$lib/logger';
  import ExpandableRow from '$lib/components/datatable/Row.svelte';
  import ThFilter from '$lib/components/datatable/accessories/Filter.svelte';
  import ThSort from '$lib/components/datatable/accessories/Sort.svelte';
  import RowsPerPage from '$lib/components/datatable/accessories/Rows.svelte';
  import RowCount from '$lib/components/datatable/accessories/Count.svelte';
  import Pagination from '$lib/components/datatable/accessories/Pagination.svelte';
  import Search from '$lib/components/datatable/accessories/Search.svelte';
  import Loading from '$lib/components/Loading.svelte';

  interface Props extends TableProps {
    handler: TableHandler | RemoteTableHandler;
  }

  let {
    tableName,
    handler,
    isLoading = $bindable(false),
    searchable = false,
    title = '',
    ariaLabel = '',
    fullWidth = false,
    options = [5, 10, 20, 50, 100],
    columns = [],
    cellOverides = {},
    tableAuto = true,
    stickyHeader = false,
    showPagination = true,
    class: className = '',
    isClickable = false,
    expandable = false,
    rowClickHandler = () => {},
    rowClickKeys = [],
    tableActions,
    searchLogAction,
    rowClickLogAction,
  }: Props = $props();

  $effect(() => {
    if (showPagination) return;

    if (handler instanceof TableHandler) {
      handler.setRowsPerPage(handler.allRows.length);
    } else {
      handler.setRowsPerPage(handler.totalRows);
    }
  });

  let tbodyElement: HTMLTableSectionElement | undefined = $state();
  let activeRowIndex = $state(0);
  let announcement = $state('');
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  // Clear-then-set so a repeated identical message is still announced, and
  // clear afterwards so stale text does not linger in the live region.
  function announce(text: string) {
    clearTimeout(announceTimer);
    announcement = '';
    announceTimer = setTimeout(() => {
      announcement = text;
      announceTimer = setTimeout(() => (announcement = ''), 5000);
    }, 30);
  }
  let pendingPageFocus: { target: 'first' | 'last'; page: number } | null = null;
  // aria-describedby is a space-separated IDREF list, so the id must not
  // contain whitespace (user tables are named after free-form connection labels).
  const helpId = $derived(`${tableName.replaceAll(' ', '_')}-kbd-help`);

  function dataRows(): HTMLTableRowElement[] {
    if (!tbodyElement) return [];
    return Array.from(tbodyElement.querySelectorAll<HTMLTableRowElement>('tr[id^="row-"]'));
  }

  function focusRow(rowElement: HTMLTableRowElement, index: number) {
    activeRowIndex = index;
    if (stickyHeader) {
      const thead = tbodyElement?.parentElement?.querySelector('thead');
      if (thead instanceof HTMLElement) {
        rowElement.style.scrollMarginTop = `${thead.offsetHeight}px`;
      }
    }
    rowElement.focus();
    rowElement.scrollIntoView?.({ block: 'nearest' });
  }

  $effect(() => {
    if (activeRowIndex >= handler.rows.length) {
      activeRowIndex = Math.max(0, handler.rows.length - 1);
    }
  });

  // Keep the roving tabindex coherent as data changes: take the rows'
  // interactive children out of the page tab order (they stay reachable with
  // the left/right arrow keys).
  $effect(() => {
    void handler.rows;
    if (!isClickable || !tbodyElement) return;
    for (const rowElement of dataRows()) {
      rowElement
        .querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')
        .forEach((element) => element.setAttribute('tabindex', '-1'));
    }
  });

  // After a keyboard-initiated page change, focus the first/last row of the new
  // page once it has rendered (the Explorer replaces rows after a server fetch).
  // The page check discards a stale pending focus if the data changed for some
  // other reason in the meantime (e.g. a new search reset the page).
  $effect(() => {
    void handler.rows;
    if (!isClickable || !pendingPageFocus) return;
    const { target, page } = pendingPageFocus;
    pendingPageFocus = null;
    if (handler.currentPage !== page) return;
    const rows = dataRows();
    if (!rows.length) return;
    const index = target === 'first' ? 0 : rows.length - 1;
    focusRow(rows[index], index);
    announce(`Page ${handler.currentPage} of ${handler.pages?.length ?? 1}`);
  });

  function pageByKeyboard(direction: 'previous' | 'next') {
    if (pendingPageFocus) return; // a page change is already in flight (key repeat)
    const lastPage = handler.pages?.length ?? 1;
    if (direction === 'next' && handler.currentPage >= lastPage) return;
    if (direction === 'previous' && handler.currentPage <= 1) return;
    pendingPageFocus = {
      target: direction === 'next' ? 'first' : 'last',
      page: handler.currentPage + (direction === 'next' ? 1 : -1),
    };
    handler.setPage(direction);
    log(createLog('ACTION', 'search_result.page_change', { pageNumber: handler.currentPage }));
  }

  function rowFocusables(rowElement: HTMLTableRowElement): HTMLElement[] {
    return Array.from(
      rowElement.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea'),
    ).filter((element) => !('disabled' in element && (element as HTMLButtonElement).disabled));
  }

  function closeExpandedRow() {
    if (!expandable || $activeTable !== tableName || !$activeRow) return;
    const owner = tbodyElement?.querySelector('tr.expandable-row')
      ?.previousElementSibling as HTMLElement | null;
    // Only pull focus back to the opener row when focus was on it or inside the
    // closing panel; if the user has arrowed to another row, leave them there.
    const current = document.activeElement;
    const onAnotherRow =
      current instanceof HTMLTableRowElement && current !== owner && dataRows().includes(current);
    closeActiveRow();
    if (!onAnotherRow) owner?.focus();
  }

  function onTbodyFocusin(event: FocusEvent) {
    if (!isClickable || !(event.target instanceof HTMLElement)) return;
    const rowElement = event.target.closest('tr');
    if (!rowElement) return;
    const index = dataRows().indexOf(rowElement as HTMLTableRowElement);
    if (index >= 0) activeRowIndex = index;
  }

  // Sort headers are ordinary tab stops before the grid; ArrowDown from the
  // header row drops focus into the grid's active row so "tab to the table,
  // press down" works on sortable tables too.
  function onTheadKeydown(event: KeyboardEvent) {
    if (!isClickable || event.key !== 'ArrowDown') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (isFormField(event.target)) return;
    const rows = dataRows();
    const index = Math.min(activeRowIndex, rows.length - 1);
    if (index < 0) return;
    event.preventDefault();
    focusRow(rows[index], index);
  }

  function onTbodyKeydown(event: KeyboardEvent) {
    if (!isClickable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      // An inner widget (e.g. a combobox closing its dropdown) already used
      // this press.
      if (event.defaultPrevented) return;
      if (isTextEntryField(target)) {
        // Per the APG grid pattern, the first Escape steps out of the field
        // back to the row; a second Escape then closes the panel.
        const fieldRow = target.closest('tr');
        const rowElement = fieldRow?.classList.contains('expandable-row')
          ? (fieldRow.previousElementSibling as HTMLElement | null)
          : fieldRow;
        if (rowElement) {
          event.preventDefault();
          rowElement.focus();
        }
        return;
      }
      closeExpandedRow();
      return;
    }
    const rowElement = target.closest('tr');
    if (!rowElement || rowElement.classList.contains('expandable-row') || isFormField(target)) {
      return;
    }
    const rows = dataRows();
    const index = rows.indexOf(rowElement);
    if (index === -1) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (index < rows.length - 1) focusRow(rows[index + 1], index + 1);
        else pageByKeyboard('next');
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) focusRow(rows[index - 1], index - 1);
        else pageByKeyboard('previous');
        break;
      case 'Home':
        event.preventDefault();
        focusRow(rows[0], 0);
        break;
      case 'End':
        event.preventDefault();
        focusRow(rows[rows.length - 1], rows.length - 1);
        break;
      case 'ArrowRight': {
        const focusables = rowFocusables(rowElement);
        const current = target.closest('a[href], button') as HTMLElement | null;
        const next = focusables[current ? focusables.indexOf(current) + 1 : 0];
        if (next) {
          event.preventDefault();
          next.focus();
        }
        break;
      }
      case 'ArrowLeft': {
        const current = target.closest('a[href], button') as HTMLElement | null;
        if (!current) break;
        event.preventDefault();
        const focusables = rowFocusables(rowElement);
        const previous = focusables[focusables.indexOf(current) - 1];
        if (previous) previous.focus();
        else rowElement.focus();
        break;
      }
    }
  }
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
        <div class="flex-none mt-4">
          <Search {handler} logAction={searchLogAction} />
        </div>
      {/if}
    </header>
  {/if}
  {#if isClickable}
    <p id={helpId} class="sr-only">
      Use the up and down arrow keys to move between rows, Home and End to jump to the first or last
      row, and the right and left arrow keys to reach a row's action buttons. Press Enter or Space
      to open a row. On paginated tables the down arrow continues onto the next page. Press Escape
      to close an expanded row; from a text field, the first Escape returns focus to the row.
      Additional single-key shortcuts are listed in each action button's label.
    </p>
    <div class="sr-only" aria-live="polite">{announcement}</div>
  {/if}
  <table
    id="{tableName}-table"
    data-testid="{tableName}-table"
    class="table table-{tableAuto ? 'auto' : 'fixed'} {className}"
    class:w-max={fullWidth}
    class:clickable={isClickable}
    role={isClickable ? 'grid' : undefined}
    aria-label={isClickable ? ariaLabel || title || tableName : undefined}
    aria-describedby={isClickable ? helpId : undefined}
  >
    <caption class="sr-only">{ariaLabel || title || tableName}</caption>
    <!-- Delegates ArrowDown from the sort-header buttons into the grid rows. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <thead onkeydown={onTheadKeydown}>
      <tr class:sticky-header={stickyHeader}>
        {#each columns as column}
          {#if column.sort}
            <ThSort {handler} orderBy={column.dataElement} class={column.class}
              >{column.label}</ThSort
            >
          {:else if column.filter}
            <ThFilter {handler} class={column.class} filterBy={column.dataElement} />
          {:else}
            <th scope="col" class={column.class}>{column.label}</th>
          {/if}
        {/each}
      </tr>
    </thead>
    <!-- The tbody only delegates key events bubbling from its focusable rows,
         which carry the interactive semantics (grid pattern). -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <tbody bind:this={tbodyElement} onkeydown={onTbodyKeydown} onfocusin={onTbodyFocusin}>
      {#if isLoading}
        <tr>
          <td colspan={columns.length} class="text-center py-8">
            <div class="flex justify-center items-center">
              <Loading ring size="small" color="primary" />
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
            {rowClickKeys}
            {rowClickLogAction}
            {isClickable}
            {expandable}
            tabindex={isClickable ? (i === activeRowIndex ? 0 : -1) : -1}
          />
        {/each}
      {:else}
        <tr><td colspan={columns.length}>No entries found.</td></tr>
      {/if}
    </tbody>
  </table>
  {#if showPagination}
    <footer class="flex justify-between mt-1">
      <RowCount {handler} />
      <div class="flex justify-end gap-4">
        <RowsPerPage {tableName} {handler} {options} />
        <Pagination {handler} />
      </div>
    </footer>
  {/if}
</div>

<style>
  table thead th {
    font-weight: normal !important;
  }
</style>
