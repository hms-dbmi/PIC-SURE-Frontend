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
  import { onMount } from 'svelte';
  import SidePanel from '$lib/components/explorer/results/SidePanel.svelte';
  import { page } from '$app/stores';
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ModalWrapper from '$lib/components/ModalWrapper.svelte';
  import FilterWarning from '$lib/components/FilterWarning.svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';

  const modalStore = getModalStore();

  // Highlight.js
  import hljs from 'highlight.js/lib/core';
  import R from 'highlight.js/lib/languages/r';
  import python from 'highlight.js/lib/languages/python';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';
  import 'highlight.js/styles/obsidian.css';
  import { beforeNavigate } from '$app/navigation';
  import { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter } from '$lib/stores/Filter.ts';

  hljs.registerLanguage('python', python);
  hljs.registerLanguage('r', R);
  storeHighlightJs.set(hljs);

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

  $: showSidebar =
    ($page.url.pathname.includes('/explorer') || $page.url.pathname.includes('/discover')) &&
    !$page.url.pathname.includes('/export') &&
    !$page.url.pathname.includes('/distributions');

  beforeNavigate((nav) => {
    if ($hasInvalidFilter && nav?.to?.url.pathname.includes('/explorer')) {
      modalStore.trigger({
      type: 'component',
      component: 'modalWrapper',
      meta: { component: FilterWarning, width: 'w-3/4' },
      });
    } else if (($hasGenomicFilter || $hasUnallowedFilter) && nav?.to?.url.pathname.includes('/discover')) {
      modalStore.trigger({
        type: 'component',
        component: 'modalWrapper',
        meta: { component: FilterWarning, width: 'w-3/4' },
        });
      }
  });
</script>

<Toast position="t" />
<Modal {...modalProps} />
<AppShell>
  <svelte:fragment slot="header">
    <Navigation />
  </svelte:fragment>
  <svelte:fragment slot="sidebarRight">
    {#if showSidebar}
      <div id="right-panel-container" class={'flex'}>
        <SidePanel />
      </div>
    {/if}
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
