<script lang="ts">
  import { AppShell, initializeStores, Modal, Toast, storePopup } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
  import { onMount } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import Navigation from '$lib/components/Navigation.svelte';

  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  initializeStores();
  let modalProps: Record<string, unknown> = {
    buttonPositive: 'variant-filled-primary',
  };
  onMount(() => {
    document.body.classList.add('started');
  });
</script>

<Toast />
<Modal {...modalProps} />
<AppShell>
  <svelte:fragment slot="header">
    <Navigation />
  </svelte:fragment>
  <slot />
  <svelte:fragment slot="footer"></svelte:fragment>
</AppShell>
