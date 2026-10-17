<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import SearchInput from '#lib/ui/SearchInput.svelte';

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

<SearchInput label="Search table" bind:value={search.value} oninput={handleInput} />
