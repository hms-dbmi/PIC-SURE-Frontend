<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';
  import DataTable from '#lib/ui/datatable/DataTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import Actions from '#lib/explorer/components/cell/Actions.svelte';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
  import type { SearchResult } from '#lib/explorer/types.ts';

  // The search-results table as Explorer.svelte wires it: its `id` column renders the row actions.
  interface Props {
    handler: ComponentProps<typeof DataTable<SearchResult>>['handler'];
    columns: Column<SearchResult>[];
    expandedRow: Snippet<[SearchResult]>;
  }

  let { handler, columns, expandedRow }: Props = $props();
  const withActions = $derived(
    columns.map((column) => (column.dataElement === 'id' ? { ...column, cell: actions } : column)),
  );
</script>

{#snippet actions(row: SearchResult)}
  <Actions {row} />
{/snippet}

<DataTable
  tableName="ExplorerTable"
  id="explorer-table"
  {handler}
  columns={withActions}
  isClickable
  rowKey="conceptPath"
  expansion={explorerPanel}
  {expandedRow}
/>
