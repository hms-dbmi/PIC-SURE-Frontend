<script lang="ts">
  import { onMount } from 'svelte';

  const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

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

  function loadScript(): Promise<TurnstileApi> {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise((resolve, reject) => {
      // the script tag survives component destroy so api.js loads at most once per page load
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error('Turnstile script loaded without defining its API'));
      });
      script.addEventListener('error', (event) => {
        // a failed script element never re-fires events; drop it so a later mount can retry
        (event.target as HTMLScriptElement).remove();
        reject(new Error('Failed to load the Turnstile script'));
      });
    });
  }

  onMount(() => {
    let widgetId: string | undefined;
    let destroyed = false;

    loadScript()
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
