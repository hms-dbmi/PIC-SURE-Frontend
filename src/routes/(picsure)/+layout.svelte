<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { beforeNavigate } from '$app/navigation';

  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import { toaster } from '$lib/toaster';

  import {
    hasInvalidFilter,
    hasGenomicFilter,
    hasUnallowedFilter,
    filterWarning,
  } from '$lib/stores/Filter.ts';

  import Shell from '$lib/components/Shell.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import SiteBannerRegion from '$lib/components/banner/SiteBannerRegion.svelte';
  import SidePanel from '$lib/components/explorer/results/SidePanel.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import DashboardDrawer from '$lib/components/dashboard/DashboardDrawer.svelte';
  import FilterWarning from '$lib/components/explorer/FilterWarning.svelte';
  import { config } from '$lib/configuration.svelte';
  import { chat, AssistedSearch } from '$lib/assistedSearch';

  let { children }: { children?: Snippet } = $props();
  let filterWarningModal: boolean = $state(false);

  onMount(() => {
    document.body.classList.add('started');
  });

  let showSidebar = $derived(
    (page.url.pathname.includes('/explorer') || page.url.pathname.includes('/discover')) &&
      !page.url.pathname.includes('/export') &&
      !page.url.pathname.includes('/distributions'),
  );

  // Only the Explorer search page has the assistant; its toggle button lives in that page.
  let showAssistedSearch = $derived(
    config.features.enableAssistedSearch &&
      chat.open &&
      page.url.pathname.replace(/\/$/, '').endsWith('/explorer'),
  );

  beforeNavigate(({ to, cancel }) => {
    const notAuthorized =
      !page.url.pathname.includes('/explorer') &&
      to?.url.pathname.includes('/explorer') &&
      $hasInvalidFilter;
    const stigmatizing =
      to?.url.pathname.includes('/discover') && ($hasGenomicFilter || $hasUnallowedFilter);

    if (stigmatizing || notAuthorized) {
      if (stigmatizing) $filterWarning = 'stigmatizing';
      else if (notAuthorized) $filterWarning = 'notAuthorized';

      cancel();
      filterWarningModal = true;
    }
  });
</script>

<Toaster {toaster} />
<FilterWarning bind:open={filterWarningModal} />
<Drawer position="right" width="w-1/2">
  <DashboardDrawer />
</Drawer>
<Shell>
  {#snippet header()}
    <SiteBannerRegion />
    <Navigation />
  {/snippet}
  {#snippet sidebarRight()}
    {#if showSidebar}
      <div id="sidebar-right" class="flex overflow-auto">
        <SidePanel />
      </div>
    {/if}
  {/snippet}
  {#snippet pageTop()}
    {#if showAssistedSearch}
      <AssistedSearch session={chat} />
    {/if}
  {/snippet}
  {@render children?.()}
  {#snippet pageFooter()}
    <Footer />
  {/snippet}
</Shell>
