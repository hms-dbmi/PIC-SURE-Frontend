<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { initSanitizeConfig } from '$lib/utilities/HTML';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';

  let { children }: { children?: Snippet } = $props();

  onMount(initSanitizeConfig);
</script>

<main class="w-full h-full">
  {@render children?.()}
  <GoogleTracking />
</main>
