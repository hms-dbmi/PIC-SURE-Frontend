<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { get } from 'svelte/store';

  import { page } from '$app/state';

  import { initHandler, searchTerm, tableHandler } from '$lib/stores/Search';

  let { children }: { children?: Snippet } = $props();

  // Mirrors /explorer/+layout.svelte. Kept as a separate layout on purpose: leaving Discover
  // for Explore (or the other way round) must destroy one session and start another, so the
  // open-access results of one page can never be shown on the other.
  let releaseHandler: (() => void) | undefined;

  onMount(() => {
    releaseHandler = initHandler();
    // initHandler() drops whatever the previous session loaded, so the new one needs a first
    // load: either the term the URL is seeding, or an explicit invalidate.
    const seededTerm = page.url.searchParams.get('search');
    if (seededTerm && seededTerm !== get(searchTerm)) {
      searchTerm.set(seededTerm);
    } else {
      tableHandler.invalidate();
    }
  });

  onDestroy(() => releaseHandler?.());
</script>

{@render children?.()}
