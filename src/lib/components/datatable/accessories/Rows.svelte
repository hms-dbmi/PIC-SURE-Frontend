<script lang="ts">
  import { TableHandler as RemoteHander } from '@vincjo/datatables/server';

  interface Props {
    handler: RemoteHander;
    options?: number[];
    class?: string;
  }

  let { handler, options = [5, 10, 20, 50], class: className = '' }: Props = $props();

  const setRowsPerPage = () => {
    handler.setPage(1);
    if (handler instanceof RemoteHander) {
      handler.invalidate();
    }
  };
</script>

<aside class={className}>
  <label class="flex place-items-center"
    >Show
    <select
      id="row-count-select"
      class="select ml-2"
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
