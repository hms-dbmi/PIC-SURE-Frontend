<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { beforeNavigate } from '$app/navigation';

  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import { toaster } from '#lib/ui/toaster.ts';

  import {
    hasInvalidFilter,
    hasGenomicFilter,
    hasUnallowedFilter,
    filterWarning,
  } from '#lib/query/filters.ts';

  import Shell from '#lib/shell/Shell.svelte';
  import Navigation from '#lib/shell/Navigation.svelte';
  import SiteBannerRegion from '#lib/banners/components/SiteBannerRegion.svelte';
  import SidePanel from '#lib/explorer/components/results/SidePanel.svelte';
  import Footer from '#lib/shell/Footer.svelte';
  import FilterWarning from '#lib/explorer/components/FilterWarning.svelte';

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
<Shell>
  {#snippet header()}
    <SiteBannerRegion />
    <Navigation />
  {/snippet}
  {#snippet sidebarRight()}
    {#if showSidebar}
      <div id="results-sidebar" class="flex overflow-auto">
        <SidePanel />
      </div>
    {/if}
  {/snippet}
  {@render children?.()}
  {#snippet pageFooter()}
    <Footer />
  {/snippet}
</Shell>
