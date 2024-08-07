<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  initializeStores();
</script>

<main class="w-full h-full">
  <slot />
</main>
