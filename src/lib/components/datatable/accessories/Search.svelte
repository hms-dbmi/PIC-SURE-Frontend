<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';
  import { log, createLog } from '$lib/logger';

  let {
    handler,
    logAction,
  }: {
    handler: TableHandler | RemoteTableHandler;
    logAction?: string;
  } = $props();

  const search = (() => handler.createSearch())();

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleInput() {
    search.set();
    if (logAction) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (search.value) {
          log(createLog('ACTION', logAction, { term: search.value }));
        }
      }, 500);
    }
  }
</script>

<input
  class="input text-sm sm:w-64 w-36"
  type="search"
  placeholder="Search..."
  bind:value={search.value}
  oninput={handleInput}
/>
