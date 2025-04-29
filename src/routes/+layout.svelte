<script lang="ts">
  import type { Snippet } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { initializeBranding } from '$lib/configuration';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';

  let { children }: { children?: Snippet } = $props();

  initializeBranding();
</script>

<main class="w-full h-full">
  {@render children?.()}
  <GoogleTracking />
</main>
