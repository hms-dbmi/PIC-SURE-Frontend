<script lang="ts">
  import {
    AppShell,
    initializeStores,
    Modal,
    Toast,
    storePopup,
    type ModalComponent,
  } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
  import Navigation from '$lib/components/Navigation.svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../../app.postcss';
  import { onMount } from 'svelte';
  import SidePanel from '$lib/components/explorer/results/SidePanel.svelte';
  import { page } from '$app/stores';
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ModalWrapper from '$lib/components/ModalWrapper.svelte';

  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  initializeStores();
  // Registered list of Components for Modals
  const modalComponentRegistry: Record<string, ModalComponent> = {
    stepper: { ref: ExportStepper },
    modalWrapper: { ref: ModalWrapper },
  };
  let modalProps: Record<string, unknown> = {
    buttonPositive: 'variant-filled-primary',
    buttonNeutral: 'variant-ghost-primary',
    components: modalComponentRegistry,
  };

  onMount(() => {
    document.body.classList.add('started');
  });

  $: classesSidebar =
    $page.url.pathname.includes('/explorer') && !$page.url.pathname.includes('/export')
      ? ''
      : 'hidden';
</script>

<Toast position="t" />
<Modal {...modalProps} />
<AppShell>
  <svelte:fragment slot="header">
    <Navigation />
  </svelte:fragment>
  <svelte:fragment slot="sidebarRight">
    <div id="right-panel-container" class={'flex ' + classesSidebar}>
      <SidePanel />
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
