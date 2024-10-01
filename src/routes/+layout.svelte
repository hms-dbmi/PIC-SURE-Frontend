<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { initializeBranding } from '$lib/configuration';
  import { settings } from '$lib/configuration';
  import GoogleAnalytics from '$lib/components/tracking/GoogleAnalytics.svelte';
  import GoogleConsents from '$lib/components/tracking/GoogleConsents.svelte';
  import GoogleTagManger from '$lib/components/tracking/GoogleTagManger.svelte';
  let googleTagManagerId = settings.google.tagManager;

  initializeStores();
  initializeBranding();
</script>

<main class="w-full h-full">
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe
      title="googleTagManager"
      src="https://www.googletagmanager.com/ns.html?id={googleTagManagerId}"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
  <slot />
  <GoogleConsents />
</main>
<GoogleAnalytics />
<GoogleTagManger />
