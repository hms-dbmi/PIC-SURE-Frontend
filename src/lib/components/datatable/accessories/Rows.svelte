<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteHander } from '@vincjo/datatables/remote';

  interface Props {
    handler: DataHandler | RemoteHander;
    options?: number[];
    class?: string;
  }

  const { handler, options = [5, 10, 20, 50], class: className = '' }: Props = $props();

  let rowsPerPage = $derived(handler.getRowsPerPage());
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
      bind:value={$rowsPerPage}
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
