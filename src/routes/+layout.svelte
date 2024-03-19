<script lang="ts">
  import {
    AppShell,
    initializeStores,
    Modal,
    Toast,
    getModalStore,
    type ModalSettings,
  } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';

  import Navigation from '$lib/components/Navigation.svelte';
  import { getUser } from '$lib/stores/User';

  initializeStores();
  let modalProps: Record<string, unknown> = {
    buttonPositive: 'variant-filled-primary',
  };
  const modalStore = getModalStore();
  onMount(() => {
    document.body.classList.add('started');
    checkForSession();
  });

  function checkForSession() {
    if (!sessionStorage.getItem('token')) {
      const modal: ModalSettings = {
        type: 'prompt',
        title: 'Enter Long Term Token',
        body: 'Provide your long term token below.',
        valueAttr: { type: 'text', required: true, placeholder: 'Enter token here...' },
        response: (r: string) => {
          sessionStorage.setItem('token', r);
          getUser();
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
  </svelte:fragment>
  <slot />
  <svelte:fragment slot="footer"></svelte:fragment>
</AppShell>
