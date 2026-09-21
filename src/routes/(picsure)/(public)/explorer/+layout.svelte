<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';

  import { page } from '$app/state';

  import { applySearchParam, startSearchSession } from '$lib/stores/Search';
  import SearchTabs from '$lib/components/explorer/SearchTabs.svelte';

  let { children }: { children?: Snippet } = $props();

  // The session is the layout's, not Explorer.svelte's, so the search survives navigating to
  // a child route and back.
  let releaseSession: (() => void) | undefined;

  onMount(() => {
    releaseSession = startSearchSession(page.url);
  });

  $effect(() => {
    applySearchParam(page.url);
  });

  onDestroy(() => releaseSession?.());
</script>

<SearchTabs />
{@render children?.()}
