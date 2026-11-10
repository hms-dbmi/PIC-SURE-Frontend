<script lang="ts" generics="T extends Row">
  import { untrack } from 'svelte';
  import { TableHandler } from '@vincjo/datatables';

  import { getDefaultRows } from './rowsPerPage.ts';
  import type { Row, TableProps } from './types.ts';
  import DataTable from './DataTable.svelte';

  interface Props extends TableProps<T> {
    rows: readonly T[];
  }

  let { rows, ...rest }: Props = $props();

  // One handler for the table's life, so its sort and search survive new rows. The table's name,
  // read once, picks its stored page size.
  const handler = new TableHandler<T>(
    untrack(() => [...rows]),
    { rowsPerPage: untrack(() => getDefaultRows(rest.tableName)) },
  );

  $effect.pre(() => {
    const next = [...rows];
    untrack(() => {
      handler.setRows(next);
      // setRows keeps the page even when the new rows don't reach it.
      handler.setPage(1);
    });
  });
</script>

<DataTable {handler} {...rest} />
