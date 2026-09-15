<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { get } from 'svelte/store';

  import { page } from '$app/state';

  import { initHandler, searchTerm, tableHandler } from '$lib/stores/Search';

  let { children }: { children?: Snippet } = $props();

  // The search lifecycle belongs to the layout rather than to Explorer.svelte: the handler
  // has to outlive the results page so the term, facets, current page and rows survive a
  // trip to /explorer/distributions (or any other child route) and back without refetching.
  let releaseHandler: (() => void) | undefined;

  onMount(() => {
    releaseHandler = initHandler();
    // initHandler() drops whatever the previous session loaded, so the new one needs a first
    // load: either the term the URL is seeding, or an explicit invalidate. Doing this here
    // rather than in Explorer.svelte is the point of the hoist - repeating it every time the
    // results page remounts is exactly the refetch this layout exists to avoid.
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
