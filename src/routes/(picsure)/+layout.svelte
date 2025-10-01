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
  import SidePanel from '$lib/components/explorer/results/SidePanel.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import DashboardDrawer from '$lib/components/dashboard/DashboardDrawer.svelte';
  import FilterWarning from '$lib/components/explorer/FilterWarning.svelte';

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

  beforeNavigate(({ to, cancel }) => {
    const notAuthorized = to?.url.pathname.includes('/explorer') && $hasInvalidFilter;
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
    <div class="alert-banner">
      <p>
        Because of a lapse in government funding, the information on this website may not be up to date,
        transactions submitted via the website may not be processed, and the agency may not be able to
        respond to inquiries until appropriations are enacted. The NIH Clinical Center (the research
        hospital of NIH) is open. For more details about its operating status, please visit <a
          href="http://cc.nih.gov/"
          class="anchor"
          target="_blank"
          rel="noopener noreferrer">cc.nih.gov.</a
        >
        Updates regarding government operating status and resumption of normal operations can be found at
        <a href="http://opm.gov/" class="anchor" target="_blank" rel="noopener noreferrer">opm.gov.</a>
      </p>
    </div>
    <Navigation />
  {/snippet}
  {#snippet sidebarRight()}
    {#if showSidebar}
      <div id="sidebar-right" class="flex overflow-auto">
        <SidePanel />
      </div>
    {/if}
  {/snippet}
  {@render children?.()}
  {#snippet pageFooter()}
    <Footer />
  {/snippet}
</Shell>

<style>
  .alert-banner {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    position: relative;
    border-style: solid;
    border-image: initial;
    border-width: 0px 0px 6px;
    padding: 0.5rem 1rem 0.5rem 2rem;
    gap: 1rem;
    color: rgb(0, 0, 0);
    background: var(--color-error-50);
    border-color: var(--color-error-500);
  }
</style>