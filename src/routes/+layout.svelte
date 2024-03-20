<script lang="ts">
  import { AppShell, initializeStores, Modal, Toast } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import Navigation from '$lib/components/Navigation.svelte';

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
