<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { initSanitizeConfig } from '$lib/utilities/HTML';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { config } from '$lib/configuration.svelte';
  import { log, createLog } from '$lib/logger';

  let { children }: { children?: Snippet } = $props();

  onMount(initSanitizeConfig);

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
  {#if config.error}
    <ErrorAlert color="warning" title="Configuration Error">
      {config.error}
    </ErrorAlert>
  {/if}
  {@render children?.()}
  <GoogleTracking />
</main>
