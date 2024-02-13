<script lang="ts">
  import { AppShell } from '@skeletonlabs/skeleton';
  import Navigation from '$lib/navigation.svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  // // Floating UI for Popups
  // import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  // import { storePopup } from '@skeletonlabs/skeleton';
  // storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<AppShell>
  <svelte:fragment slot="header">
    <Navigation />
  </svelte:fragment>
  <hr class="!border-t-2" />
  <!-- (sidebarLeft) -->
  <!-- (sidebarRight) -->
  <!-- (pageHeader) -->
  <slot />
  <!-- (pageFooter) -->
  <svelte:fragment slot="footer"></svelte:fragment>
</AppShell>
