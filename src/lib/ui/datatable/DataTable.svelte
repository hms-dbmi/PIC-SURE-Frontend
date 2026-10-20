<script lang="ts" generics="T extends Row">
  import { TableHandler } from '@vincjo/datatables';

  import type { AnyTableHandler, Row, TableProps } from './types.ts';
  import { hasTableEvents, getTableEvents, setTableContext, type TableContext } from './context.ts';
  import { GridKeyboard } from './gridKeyboard.svelte.ts';
  import TableRow from './Row.svelte';
  import ThFilter from './accessories/Filter.svelte';
  import ThSort from './accessories/Sort.svelte';
  import RowsPerPage from './accessories/Rows.svelte';
  import RowCount from './accessories/Count.svelte';
  import Pagination from './accessories/Pagination.svelte';
  import Search from './accessories/Search.svelte';
  import LiveRegion from '#lib/ui/LiveRegion.svelte';
  import Loading from '#lib/ui/Loading.svelte';

  interface Props extends TableProps<T> {
    handler: AnyTableHandler<T>;
  }

  let {
    tableName,
    id,
    'data-testid': testid,
    handler,
    isLoading = false,
    searchable = false,
    title = '',
    ariaLabel = '',
    fullWidth = false,
    options = [5, 10, 20, 50, 100],
    columns = [],
    stickyHeader = false,
    showPagination = true,
    class: className = '',
    isClickable = false,
    rowKey,
    expansion,
    expandedRow,
    rowClickHandler,
    rowClickKeys = [],
    tableActions,
    onsearch,
    onPageChange,
  }: Props = $props();

  const events = hasTableEvents() ? getTableEvents() : undefined;
  const uid = $props.id();
  const tableId = $derived(id ?? uid);
  const helpId = $derived(`${tableId}-kbd-help`);
  // Expansion needs all three; a table without them never expands a row.
  const expandable = $derived(!!(expandedRow && expansion && rowKey));

  const grid = new GridKeyboard({
    get enabled() {
      return isClickable;
    },
    get id() {
      return tableId;
    },
    get handler() {
      return handler;
    },
    get loading() {
      return isLoading;
    },
    get stickyHeader() {
      return stickyHeader;
    },
    get expansion() {
      return expandable ? expansion : undefined;
    },
    onpagechange: (page) => events?.pageChange(page),
  });

  function isExpanded(row: T): boolean {
    return expandable && !!rowKey && expansion?.activeRow === String(row[rowKey]);
  }

  const context: TableContext<T> = {
    get id() {
      return tableId;
    },
    get columns() {
      return columns;
    },
    get clickable() {
      return isClickable;
    },
    get rowClickKeys() {
      return rowClickKeys;
    },
    get expandedRow() {
      return expandable ? expandedRow : undefined;
    },
    isExpanded,
    tabindex: (index) => grid.tabindex(index),
    activate(row) {
      rowClickHandler?.(row);
      if (expandable && rowKey) expansion?.toggleRow(String(row[rowKey]));
    },
  };
  // The context can't carry T; each Row only hands back the rows this table gave it.
  setTableContext(context as unknown as TableContext);

  $effect(() => {
    if (showPagination) return;

    if (handler instanceof TableHandler) {
      handler.setRowsPerPage(handler.allRows.length);
    } else {
      handler.setRowsPerPage(handler.totalRows);
    }
  });
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
          <Search {handler} {onsearch} />
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
    <LiveRegion message={grid.announcer.message} />
  {/if}
  <table
    id={tableId}
    data-testid={testid}
    class="table {className}"
    class:w-max={fullWidth}
    class:clickable={isClickable}
    role={isClickable ? 'grid' : undefined}
    aria-label={isClickable ? ariaLabel || title || tableName : undefined}
    aria-describedby={isClickable ? helpId : undefined}
    {@attach grid.attach}
  >
    <caption class="sr-only">{ariaLabel || title || tableName}</caption>
    <thead>
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
    <tbody>
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
          <TableRow index={i} {row} />
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
        <Pagination {handler} {onPageChange} />
      </div>
    </footer>
  {/if}
</div>

<style>
  table thead th {
    font-weight: normal !important;
  }
</style>
