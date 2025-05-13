<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { initializeBranding } from '$lib/configuration';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
  import { settings } from '$lib/configuration';
  import { v4 as uuidv4 } from 'uuid';
  import { browser } from '$app/environment';

  let googleTag = settings.google.tagManager;
  if (browser && !sessionStorage.getItem('sessionId')) {
    sessionStorage.setItem('sessionId', uuidv4());
  }

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
