<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { initializeBranding } from '$lib/configuration';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
  import { settings } from '$lib/configuration';

  let googleTag = settings.google.tagManager;

  initializeStores();
  initializeBranding();
</script>

<!-- Google Tag Manager (noscript) -->
{#if googleTag}
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id={googleTag}"
      title="googleTagManger"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
{/if}

<main class="w-full h-full">
  <slot />
  <GoogleTracking />
</main>
