<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  export let handler: DataHandler;
  const rowsPerPage = handler.getRowsPerPage();
  const options = [5, 10, 20, 50, 100];
</script>

<aside>
  <label class="flex place-items-center"
    >Show
    <select
      id="row-count-select"
      class="select ml-2"
      aria-label="Rows per page"
      bind:value={$rowsPerPage}
    >
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </select>
  </label>
</aside>
