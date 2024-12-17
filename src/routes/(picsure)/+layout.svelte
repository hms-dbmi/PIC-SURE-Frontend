<script lang="ts">
  import {
    AppShell,
    Modal,
    Toast,
    Drawer,
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
  import ModalWrapper from '$lib/components/modals/ModalWrapper.svelte';
  import { getModalStore, getDrawerStore } from '@skeletonlabs/skeleton';
  import { beforeNavigate } from '$app/navigation';
  import { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter } from '$lib/stores/Filter.ts';
  import DashboardDrawer from '$lib/components/datatable/DashboardDrawer.svelte';
  import FilterWarning from '$lib/components/modals/FilterWarning.svelte';

  const modalStore = getModalStore();
  const drawerStore = getDrawerStore();

  // Highlight.js
  import hljs from 'highlight.js/lib/core';
  import R from 'highlight.js/lib/languages/r';
  import python from 'highlight.js/lib/languages/python';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';
  import 'highlight.js/styles/obsidian.css';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

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

  let showSidebar =
    $derived(($page.url.pathname.includes('/explorer') || $page.url.pathname.includes('/discover')) &&
    !$page.url.pathname.includes('/export') &&
    !$page.url.pathname.includes('/distributions'));

  beforeNavigate(({ to, cancel }) => {
    if (
      ($hasInvalidFilter && to?.url.pathname.includes('/explorer')) ||
      (($hasGenomicFilter || $hasUnallowedFilter) && to?.url.pathname.includes('/discover'))
    ) {
      cancel();
      modalStore.trigger({
        type: 'component',
        component: 'filterWarning',
        response: (r: string) => {
          console.log(r);
        },
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
  {#snippet header()}
  
      <Navigation />
    
  {/snippet}
  {#snippet sidebarRight()}
  
      {#if showSidebar}
        <div id="right-panel-container" class={'flex'}>
          <SidePanel />
        </div>
      {/if}
    
  {/snippet}
  {@render children?.()}
  {#snippet pageFooter()}
  
      <Footer />
    
  {/snippet}
</AppShell>

<style>
  #right-panel-container {
    height: 100%;
  }
</style>
