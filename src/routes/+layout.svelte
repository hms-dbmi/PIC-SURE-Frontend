<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { initializeBranding } from '$lib/configuration';
  initializeStores();
  initializeBranding();
</script>

<main class="w-full h-full">
  <slot />
</main>
