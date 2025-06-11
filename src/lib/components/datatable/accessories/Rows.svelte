<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';

  import { setDefaultRows } from '../stores';

  interface Props {
    tableName: string;
    handler: TableHandler | RemoteTableHandler;
    options?: number[];
    class?: string;
  }

  let { tableName, handler, options = [5, 10, 20, 50], class: className = '' }: Props = $props();

  const setRowsPerPage = () => {
    setDefaultRows(tableName, handler.rowsPerPage);
    handler.setPage(1);
  };
</script>

<aside class={className}>
  <label class="flex place-items-center"
    >Show
    <select
      id="row-count-select"
      class="select ml-2 rounded-xl"
      aria-label="Rows per page"
      bind:value={handler.rowsPerPage}
      onchange={setRowsPerPage}
    >
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </select>
  </label>
</aside>
