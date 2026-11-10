<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { config } from '#lib/config/config.svelte.ts';
  import { untrack } from 'svelte';
  import { ACCESS, requiresLogin } from '#lib/auth/access.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import Shell from '#lib/shell/Shell.svelte';
  import Navigation from '#lib/shell/Navigation.svelte';
  import SiteBannerRegion from '#lib/banners/components/SiteBannerRegion.svelte';
  import Footer from '#lib/shell/Footer.svelte';

  // Only the root layout wraps this page, so it brings the app shell itself. Shell renders
  // nothing for a logged-out visitor on a closed deployment, who still needs the error. The
  // session is read untracked, as Shell reads it.
  let showShell = $derived(
    !requiresLogin(ACCESS.app, config.features) || untrack(() => session.isLoggedIn),
  );
  let notFound = $derived(page.status === 404);
  let title = $derived(notFound ? 'Page not found' : 'Something went wrong');
</script>

<svelte:head>
  <title>{config.branding.applicationName} | {title}</title>
</svelte:head>

{#snippet error()}
  <section id="app-error" class="flex flex-col items-center text-center gap-4 mt-16 px-4">
    <p data-testid="app-error-status" class="text-6xl font-bold text-primary-500">
      {page.status}
    </p>
    <h1 data-testid="app-error-title">{title}</h1>
    <p data-testid="app-error-message" class="subtitle">
      {notFound
        ? 'The page you are looking for does not exist or has moved.'
        : (page.error?.message ?? 'An unknown error occurred.')}
    </p>
    <div class="flex flex-wrap justify-center gap-2">
      <!-- An unexpected error may be a one-off, such as a failed load, and the visitor may
           already be on the home page, so offer a reload as well. -->
      {#if !notFound}
        <Button data-testid="app-error-retry" onclick={() => location.reload()}>Try again</Button>
      {/if}
      <Button
        data-testid="app-error-home"
        variant={notFound ? 'filled' : 'tonal'}
        href={resolve('')}>Go to the home page</Button
      >
    </div>
  </section>
{/snippet}

{#if showShell}
  <Shell>
    {#snippet header()}
      <SiteBannerRegion />
      <Navigation />
    {/snippet}
    {@render error()}
    {#snippet pageFooter()}
      <Footer />
    {/snippet}
  </Shell>
{:else}
  {@render error()}
{/if}
