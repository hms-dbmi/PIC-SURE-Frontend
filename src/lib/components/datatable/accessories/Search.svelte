<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteDataHandler } from '@vincjo/datatables/remote';
  export let handler: DataHandler | RemoteDataHandler;
  let value: string;
</script>

<input
  class="input text-sm sm:w-64 w-36"
  type="search"
  placeholder="Search..."
  bind:value
  on:input={() => handler.search(value)}
/>
