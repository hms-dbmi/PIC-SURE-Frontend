<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';

  import { getDefaultRows } from './stores';
  import type { TableProps } from './types';
  import RemoteTable from './RemoteTable.svelte';

  // Parameters
  interface Props extends TableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  }

  let { data = [], ...rest }: Props = $props();

  const handler = new TableHandler(data, {
    rowsPerPage: getDefaultRows(rest.tableName),
  });

  $effect(() => {
    handler.setRows(data);
    handler.setPage(1);
  });
</script>

<RemoteTable {handler} {...rest} />
