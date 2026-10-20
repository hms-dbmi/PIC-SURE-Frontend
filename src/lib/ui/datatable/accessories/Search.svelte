<script lang="ts" generics="T extends Row">
  import type { AnyTableHandler, Row } from '../types.ts';
  import SearchInput from '#lib/ui/SearchInput.svelte';

  let {
    handler,
    onsearch,
  }: {
    handler: AnyTableHandler<T>;
    onsearch?: (term: string) => void;
  } = $props();

  const search = $derived(handler.createSearch());

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleInput() {
    search.set();
    if (onsearch) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (search.value) onsearch(search.value);
      }, 500);
    }
  }
</script>

<SearchInput label="Search table" bind:value={search.value} oninput={handleInput} />
