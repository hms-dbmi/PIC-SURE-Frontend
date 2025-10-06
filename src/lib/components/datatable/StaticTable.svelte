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

  // eslint-disable-next-line svelte/valid-compile
  let { data = [], ...rest }: Props = $props();

  const handler = $derived(
    new TableHandler(data, {
      rowsPerPage: getDefaultRows(rest.tableName),
    }),
  );
</script>

<RemoteTable {handler} {...rest} />
