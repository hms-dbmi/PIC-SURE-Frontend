<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { config } from '#lib/configuration.svelte.ts';
  import Shell from '#lib/components/Shell.svelte';
  import Navigation from '#lib/components/Navigation.svelte';
  import SiteBannerRegion from '#lib/components/banner/SiteBannerRegion.svelte';
  import Footer from '#lib/components/Footer.svelte';

  // Only the root layout wraps this page, so it brings the app shell itself.
  let notFound = $derived(page.status === 404);
  let title = $derived(notFound ? 'Page not found' : 'Something went wrong');
</script>

<svelte:head>
  <title>{config.branding.applicationName} | {title}</title>
</svelte:head>

<Shell>
  {#snippet header()}
    <SiteBannerRegion />
    <Navigation />
  {/snippet}
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
    <a data-testid="app-error-home" class="btn preset-filled-primary-500" href={resolve('')}
      >Go to the home page</a
    >
  </section>
  {#snippet pageFooter()}
    <Footer />
  {/snippet}
</Shell>
