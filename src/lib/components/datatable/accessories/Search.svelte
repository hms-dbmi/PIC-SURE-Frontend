<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteDataHandler } from '@vincjo/datatables/remote';
  interface Props {
    handler: DataHandler | RemoteDataHandler;
  }

  let { handler }: Props = $props();
  let value: string = $state('');
</script>

<input
  class="input text-sm sm:w-64 w-36"
  type="search"
  placeholder="Search..."
  bind:value
  oninput={() => handler.search(value)}
/>
