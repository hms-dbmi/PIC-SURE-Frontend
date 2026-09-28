<script lang="ts">
  import { onMount } from 'svelte';
  import { loadTurnstile } from '$lib/turnstile';

  let {
    sitekey,
    action = 'generate-api-key',
    onToken,
    onError,
  }: {
    sitekey: string;
    action?: string;
    onToken: (token: string | null) => void;
    onError?: () => void;
  } = $props();

  let container: HTMLElement | undefined = $state();

  onMount(() => {
    let widgetId: string | undefined;
    let destroyed = false;

    loadTurnstile()
      .then((turnstile) => {
        if (destroyed || !container) return;
        widgetId = turnstile.render(container, {
          sitekey,
          action,
          theme: 'auto',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => {
            onToken(null);
            onError?.();
          },
        });
      })
      .catch(() => {
        if (destroyed) return;
        onToken(null);
        onError?.();
      });

    return () => {
      destroyed = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  });
</script>

<div data-testid="turnstile-widget" bind:this={container}></div>
