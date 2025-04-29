<script lang="ts">
  import { TableHandler } from '@vincjo/datatables/server';

  let { handler }: { handler: TableHandler } = $props();

  const search = handler.createSearch();
</script>

<input
  class="input text-sm sm:w-64 w-36"
  type="search"
  placeholder="Search..."
  bind:value={search.value}
  oninput={search.set}
/>
