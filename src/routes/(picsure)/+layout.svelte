<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { beforeNavigate } from '$app/navigation';

  import Toaster from '#lib/ui/Toaster.svelte';

  import { filterState } from '#lib/query/filters.svelte.ts';
  import { exploreMode, routeMode } from '#lib/explorer/mode.ts';

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
    exploreMode() !== undefined &&
      !page.url.pathname.includes('/export') &&
      !page.url.pathname.includes('/distributions'),
  );

  beforeNavigate(({ to, cancel }) => {
    const toMode = routeMode(to?.route.id);
    const notAuthorized =
      exploreMode() !== 'explorer' && toMode === 'explorer' && filterState.hasInvalidFilter;
    const stigmatizing =
      toMode === 'discover' && (filterState.hasGenomicFilter || filterState.hasUnallowedFilter);

    if (stigmatizing || notAuthorized) {
      if (stigmatizing) filterState.warning = 'stigmatizing';
      else if (notAuthorized) filterState.warning = 'notAuthorized';

      cancel();
      filterWarningModal = true;
    }
  });
</script>

<Toaster />
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
