<script lang="ts">
  import {
    AppShell,
    initializeStores,
    Modal,
    Toast,
    getModalStore,
    type ModalSettings,
    type ModalComponent,
    storePopup,
  } from '@skeletonlabs/skeleton';
  import Navigation from '$lib/components/Navigation.svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { onMount } from 'svelte';
  import ResultsPanel from '$lib/components/explorer/results/SidePanel.svelte';
  import { page } from '$app/stores';
  import ExportStepper from '$lib/components/explorer/dataExport/ExportStepper.svelte';
  import Footer from '$lib/components/Footer.svelte';

  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  initializeStores();
  // Registered list of Components for Modals
  const modalComponentRegistry: Record<string, ModalComponent> = {
    stepper: { ref: ExportStepper },
  };
  let modalProps: Record<string, unknown> = {
    buttonPositive: 'variant-filled-primary',
    components: modalComponentRegistry,
  };
  onMount(() => {
    document.body.classList.add('started');
  });
  $: classesSidebar = $page.url.pathname.includes('/explorer') ? '' : 'hidden';
</script>

<Toast />
<Modal {...modalProps} />
<AppShell>
  <svelte:fragment slot="header">
    <Navigation />
  </svelte:fragment>
  <svelte:fragment slot="sidebarRight">
    <div id="right-panel-container" class={'flex ' + classesSidebar}>
      <ResultsPanel />
    </div>
  </svelte:fragment>
  <slot />
  <svelte:fragment slot="pageFooter">
    <Footer />
  </svelte:fragment>
</AppShell>

<style>
  #right-panel-container {
    height: 100%;
  }
</style>
