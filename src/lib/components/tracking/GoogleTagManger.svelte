<script lang="ts">
  import { settings } from '$lib/configuration';
  import { onMount } from 'svelte';
  let googleTag = settings.google.tagManager;

  function setupDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'gtm.js', 'gtm.start': new Date().getTime() });
  }

  onMount(() => {
    if (!googleTag) {
      console.debug('Google Tag Manager ID is not set');
      return;
    }
    console.debug('Google Tag Manager ID:', googleTag);
    setupDataLayer();

    let script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtm.js?id=${googleTag}&l=dataLayer`;
    script.async = true;
    document.head.appendChild(script);
  });

</script>