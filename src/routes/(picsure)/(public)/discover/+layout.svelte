<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';

  import { page } from '$app/state';

  import { applySearchParam, startSearchSession } from '$lib/stores/Search';

  let { children }: { children?: Snippet } = $props();

  // Discover owns a session separate from Explore's on purpose: leaving one for the other
  // must end a session and start another, so open-access results can never be shown on the
  // authenticated page.
  let releaseSession: (() => void) | undefined;

  onMount(() => {
    releaseSession = startSearchSession(page.url);
  });

  $effect(() => {
    applySearchParam(page.url);
  });

  onDestroy(() => releaseSession?.());
</script>

{@render children?.()}
