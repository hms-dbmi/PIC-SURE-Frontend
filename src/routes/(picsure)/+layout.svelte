<script lang="ts">
  import { onMount } from 'svelte';
  import {
    AppShell,
    Modal,
    Toast,
    Drawer,
    storePopup,
    type ModalComponent,
    getModalStore,
    getDrawerStore,
  } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
  import { page } from '$app/stores';
  import { goto, beforeNavigate } from '$app/navigation';

  import { panelOpen } from '$lib/stores/SidePanel.ts';
  import {
    hasInvalidFilter,
    hasGenomicFilter,
    hasUnallowedFilter,
    removeGenomicFilters,
    removeUnallowedFilters,
    removeInvalidFilters,
  } from '$lib/stores/Filter.ts';

  import Navigation from '$lib/components/Navigation.svelte';
  import SidePanel from '$lib/components/explorer/results/SidePanel.svelte';
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ModalWrapper from '$lib/components/modals/ModalWrapper.svelte';
  import DashboardDrawer from '$lib/components/datatable/DashboardDrawer.svelte';
  import FilterWarning from '$lib/components/modals/FilterWarning.svelte';

  // Highlight.js
  import hljs from 'highlight.js/lib/core';
  import R from 'highlight.js/lib/languages/r';
  import python from 'highlight.js/lib/languages/python';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';
  import 'highlight.js/styles/obsidian.css';

  const modalStore = getModalStore();
  const drawerStore = getDrawerStore();

  hljs.registerLanguage('python', python);
  hljs.registerLanguage('r', R);
  storeHighlightJs.set(hljs);

  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  // Registered list of Components for Modals
  const modalComponentRegistry: Record<string, ModalComponent> = {
    stepper: { ref: ExportStepper },
    modalWrapper: { ref: ModalWrapper },
    filterWarning: { ref: FilterWarning },
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

  beforeNavigate(({ to, cancel }) => {
    const notAuthorized = to?.url.pathname.includes('/explore') && $hasInvalidFilter;
    const stigmatizing =
      to?.url.pathname.includes('/discover') && ($hasGenomicFilter || $hasUnallowedFilter);

    if (stigmatizing || notAuthorized) {
      let meta = {};
      if (stigmatizing) {
        meta = {
          message:
            'Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover',
          backTo: 'Explore',
          resetQuery: () => {
            panelOpen.set(false);
            removeGenomicFilters();
            removeUnallowedFilters();
            // Use requestAnimationFrame to ensure filter changes are fully processed
            // This gives more time for subscriptions to complete their work
            requestAnimationFrame(() => {
              // Add another requestAnimationFrame to ensure we're in a stable state
              requestAnimationFrame(() => {
                goto(`/discover`);
              });
            });
          },
        };
      }
      if (notAuthorized) {
        meta = {
          message:
            'You are not authorized to access the data in Explore based on your selected filters.',
          backTo: 'Discover',
          resetQuery: async () => {
            panelOpen.set(false);
            removeInvalidFilters();
            // Use requestAnimationFrame to ensure filter changes are fully processed
            // This gives more time for subscriptions to complete their work
            requestAnimationFrame(() => {
              // Add another requestAnimationFrame to ensure we're in a stable state
              requestAnimationFrame(() => {
                goto(`/explorer`);
              });
            });
          },
        };
      }

      cancel();
      modalStore.trigger({
        type: 'component',
        component: 'filterWarning',
        meta,
      });
    }
  });
</script>

<Toast position="t" />
<Modal {...modalProps} />
<Drawer position="right" width="w-1/2" rounded="rounded-none">
  {#if $drawerStore.id === 'dashboard-drawer'}
    <DashboardDrawer />
  {/if}
</Drawer>
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
