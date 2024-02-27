<script lang="ts">
  import { AppShell, initializeStores, Modal, Toast, getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import Navigation from '$lib/navigation.svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { onMount } from 'svelte';
  initializeStores();
  let modalProps: Record<string, unknown> = {
    buttonPositive: 'variant-filled-primary',
  };
  const modalStore = getModalStore();
  onMount(() => {
    document.body.classList.add("started");
    checkForSession();
  });
  // // Floating UI for Popups
  // import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  // import { storePopup } from '@skeletonlabs/skeleton';
  // storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  function checkForSession() {
    if (!sessionStorage.getItem('token')) {
      const modal: ModalSettings = {
      type: 'prompt',
      // Data
      title: 'Enter Long Term Token',
      body: 'Provide your long term token below.',
      // Populates the input value and attributes
      value: 'Token here...',
      valueAttr: { type: 'text', required: true },
      // Returns the updated response value
      response: (r: string) => {
        sessionStorage.setItem('token', r);
      },
    };
    modalStore.trigger(modal);
    }
  }
</script>

<Toast />
<Modal {...modalProps} />
<AppShell>
  <svelte:fragment slot="header">
    <Navigation />
    <hr class="!border-t-2" />
  </svelte:fragment>
  <!-- (sidebarLeft) -->
  <!-- (sidebarRight) -->
  <!-- (pageHeader) -->
  <slot />
  <!-- (pageFooter) -->
  <svelte:fragment slot="footer"></svelte:fragment>
</AppShell>
