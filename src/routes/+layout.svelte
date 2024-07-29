<script lang="ts">
  import { initializeStores } from '@skeletonlabs/skeleton';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  initializeStores();
</script>

<main class="w-full h-full">
  <slot />
</main>
