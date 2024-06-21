<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  export let handler: DataHandler;
  export let options: number[];
  const rowsPerPage = handler.getRowsPerPage();
</script>

<aside>
  <label class="flex place-items-center"
    >Show
    <select
      id="row-count-select"
      class="select ml-2"
      aria-label="Rows per page"
      bind:value={$rowsPerPage}
      on:change={() => handler.setPage(1)}
    >
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </select>
  </label>
</aside>
