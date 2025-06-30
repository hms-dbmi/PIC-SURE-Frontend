<script lang="ts">
  import type { Snippet } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { initializeBranding } from '$lib/configuration';
  import { loadResources } from '$lib/stores/Resources';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';

  let { children }: { children?: Snippet } = $props();

  initializeBranding();
  loadResources();
</script>

<main class="w-full h-full">
  {@render children?.()}
  <GoogleTracking />
</main>
