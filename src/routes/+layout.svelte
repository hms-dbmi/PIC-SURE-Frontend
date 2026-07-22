<script lang="ts">
  import type { Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
  import { log, createLog } from '$lib/logger';

  let { children }: { children?: Snippet } = $props();

  afterNavigate(({ from, to, type }) => {
    log(
      createLog('NAVIGATION', 'page.navigate', {
        from: from?.url?.pathname,
        to: to?.url?.pathname,
        type,
      }),
    );
  });
</script>

<main class="w-full h-full">
  {@render children?.()}
  <GoogleTracking />
</main>
