<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';

  let clazz = '';
  export { clazz as class };
  export let handler: DataHandler;
  export let filterBy: string;

  let value: string;
</script>

<th class={clazz}>
  <input
    class="input text-sm w-full"
    type="text"
    placeholder="Filter"
    bind:value
    on:input={() => {
      filterBy && handler.filter(value, filterBy);
    }}
  />
</th>

<style>
  th {
    font-weight: normal !important;
  }
</style>
