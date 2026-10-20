<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';

  import type { Column } from '#lib/ui/datatable/types.ts';
  import type { SearchResult } from '#lib/explorer/types.ts';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  import Actions from '#lib/explorer/components/cell/Actions.svelte';
  import DataTable from '#lib/ui/datatable/DataTable.svelte';

  interface Props {
    handler: ComponentProps<typeof DataTable<SearchResult>>['handler'];
    /** The branding's columns; the row actions are appended after them. */
    columns: Column<SearchResult>[];
    isLoading?: boolean;
    expandedRow: Snippet<[SearchResult]>;
  }

  let { handler, columns, isLoading = false, expandedRow }: Props = $props();

  // The tour's steps select this table and its rows by id.
  const tableId = 'explorer-table';
  const withActions: Column<SearchResult>[] = $derived([
    ...columns,
    { dataElement: 'id', label: 'Actions', class: 'w-36 text-center', cell: actionsCell },
  ]);

  function logRowClick(row: SearchResult) {
    log(
      createLog('ACTION', 'search_result.row_click', {
        variable: row.conceptPath,
        open: !explorerPanel.isExpanded(row.conceptPath),
        pageContext: getPageContext(),
      }),
    );
  }

  function scrollToTop() {
    document.getElementById(tableId)?.scrollIntoView({ block: 'start' });
  }
</script>

{#snippet actionsCell(row: SearchResult)}
  <Actions {row} />
{/snippet}

<DataTable
  isClickable
  ariaLabel="Search results"
  tableName="ExplorerTable"
  id={tableId}
  data-testid="explorer-results-table"
  {handler}
  columns={withActions}
  {isLoading}
  rowKey="conceptPath"
  expansion={explorerPanel}
  {expandedRow}
  rowClickHandler={logRowClick}
  onPageChange={scrollToTop}
/>
