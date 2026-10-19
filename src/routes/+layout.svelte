<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { asset } from '$app/paths';
  import type { AssetPath } from '$app/types';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { config } from '#lib/config/config.svelte.ts';
  import GoogleTracking from '#lib/shell/GoogleTracking.svelte';
  import ExternalLinkWarning from '#lib/shell/ExternalLinkWarning.svelte';
  import TermsDialog from '#lib/shell/TermsDialog.svelte';
  import { handleAccessReason } from '#lib/auth/accessReason.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { resumeAfterWafCaptcha } from '#lib/api/wafCaptcha.ts';

  let { children }: { children?: Snippet } = $props();

  onMount(() => {
    if (config.features.wafCaptchaRecovery) resumeAfterWafCaptcha();
    // The e2e fixture waits for this marker after each page load, so its clicks can't land
    // before hydration.
    document.documentElement.dataset.hydrated = '';
  });

  let theme = $derived(config.branding.theme);
  let favicon = $derived(
    (['aim-ahead', 'bdc', 'picsure'].includes(theme)
      ? `${theme}-favicon.png`
      : 'favicon.png') as AssetPath,
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
    // Going back to the page a guard sent the visitor to isn't a new arrival.
    if (to && type !== 'popstate') handleAccessReason(to.url);
  });
</script>

<svelte:head>
  <link rel="icon" href={asset(favicon)} />
</svelte:head>

<main class="w-full h-full" data-theme={theme}>
  {@render children?.()}
  <TermsDialog />
  <GoogleTracking />
  {#if config.features.confirmExternalNavigation}
    <ExternalLinkWarning />
  {/if}
</main>
