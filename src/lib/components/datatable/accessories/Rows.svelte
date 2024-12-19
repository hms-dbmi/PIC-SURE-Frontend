<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteHander } from '@vincjo/datatables/remote';
  export let handler: DataHandler | RemoteHander;
  export let options: number[] = [5, 10, 20, 50];
  $: rowsPerPage = handler.getRowsPerPage();
  const setRowsPerPage = () => {
    handler.setPage(1);
    if (handler instanceof RemoteHander) {
      handler.invalidate();
    }
  };
</script>

<aside class={$$props.class ?? ''}>
  <label class="flex place-items-center"
    >Show
    <select
      id="row-count-select"
      class="select ml-2"
      aria-label="Rows per page"
      bind:value={$rowsPerPage}
      on:change={() => setRowsPerPage()}
    >
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </select>
  </label>
</aside>
