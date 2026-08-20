<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { asset } from '$app/paths';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { config } from '$lib/configuration.svelte';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
  import ExternalLinkWarning from '$lib/components/ExternalLinkWarning.svelte';
  import { log, createLog } from '$lib/logger';
  import { resumeAfterWafCaptcha } from '$lib/wafCaptcha';

  let { children }: { children?: Snippet } = $props();

  onMount(() => {
    if (config.features.wafCaptchaRecovery) resumeAfterWafCaptcha();
  });

  let theme = $derived(config.branding.theme);
  let favicon = $derived(
    ['aim-ahead', 'bdc', 'picsure'].includes(theme) ? `/${theme}-favicon.png` : '/favicon.png',
  );

  // theme.css tokens live under [data-theme='...'], but toasts/modals/drawers are
  // portaled onto document.documentElement rather than rendered inside <main> - so
  // data-theme has to be set there too, or that portal UI falls back to unthemed
  // defaults regardless of what <main> carries for its own (SSR-safe) content.
  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });

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

<svelte:head>
  <link rel="icon" href={asset(favicon)} />
</svelte:head>

<main class="w-full h-full" data-theme={theme}>
  {@render children?.()}
  <GoogleTracking />
  {#if config.features.confirmExternalNavigation}
    <ExternalLinkWarning />
  {/if}
</main>
