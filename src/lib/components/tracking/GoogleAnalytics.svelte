<script lang="ts">
  import { page } from '$app/stores';
  import { settings } from '$lib/configuration';
  import { gtag } from 'gtagjs';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  let googleAnalyticsID = settings.google.analytics;

  $: {
    if (
      googleAnalyticsID &&
      browser &&
      typeof gtag === 'function' &&
      localStorage.getItem('consentMode')?.includes('granted')
    ) {
      console.debug('Tracking page view with Google Analytics');
      // Send page view to Google Analytics
      gtag('config', googleAnalyticsID, {
        page_title: document.title,
        page_path: $page.url.pathname,
      });
    }
  }

  const setupGoogleAnalytics = () => {
    gtag('js', new Date());
    gtag('config', googleAnalyticsID);

    let consentMode = localStorage.getItem('consentMode');
    if (!consentMode) {
      // Default to deny all
      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'denied',
        ad_personalization: 'denied',
        ad_data: 'denied',
      });
    }
  };

  onMount(() => {
    googleAnalyticsID && setupGoogleAnalytics();
  });
</script>

<svelte:head>
  {#if googleAnalyticsID}
    <script async src="https://www.googletagmanager.com/gtag/js?id={googleAnalyticsID}">
    </script>
  {/if}
</svelte:head>
