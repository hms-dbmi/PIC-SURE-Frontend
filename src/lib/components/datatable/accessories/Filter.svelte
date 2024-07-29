<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteDataHandler } from '@vincjo/datatables/remote';
  export let handler: DataHandler | RemoteDataHandler;
  export let filterBy: string;
  let timeout: ReturnType<typeof setTimeout>;

  let value: string;
  const filter = () => {
    handler.filter(value, filterBy);
    if (handler instanceof RemoteDataHandler) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handler.invalidate();
      }, 400);
    }
  };
</script>

<th class={$$props.class ?? ''}>
  <input
    class="input text-sm w-full"
    type="text"
    placeholder="Filter"
    bind:value
    on:input={filter}
  />
</th>

<style>
  th {
    font-weight: normal !important;
  }
</style>
