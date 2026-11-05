<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { beforeNavigate } from '$app/navigation';

  import Toaster from '#lib/ui/Toaster.svelte';
  import { setTableEvents } from '#lib/ui/datatable/context.ts';
  import { tableEvents } from '#lib/telemetry/tableEvents.ts';

  import { filterState } from '#lib/query/filters.svelte.ts';
  import { exploreMode, routeMode } from '#lib/explorer/mode.ts';

  import Shell from '#lib/shell/Shell.svelte';
  import Navigation from '#lib/shell/Navigation.svelte';
  import SiteBannerRegion from '#lib/banners/components/SiteBannerRegion.svelte';
  import SidePanel from '#lib/explorer/components/results/SidePanel.svelte';
  import Footer from '#lib/shell/Footer.svelte';
  import FilterWarning from '#lib/explorer/components/FilterWarning.svelte';
  import { chat, AssistedSearch, assistedSearchEnabled } from '#lib/assistedSearch/index.ts';

  let { children }: { children?: Snippet } = $props();
  let filterWarningModal: boolean = $state(false);
  let filterWarningTrigger: HTMLElement | undefined = $state();
  setTableEvents(tableEvents);

  onMount(() => {
    document.body.classList.add('started');
  });

  let showSidebar = $derived(
    exploreMode() !== undefined &&
      !page.url.pathname.includes('/export') &&
      !page.url.pathname.includes('/distributions'),
  );

  let showAssistedSearch = $derived.by(() => {
    const path = page.url.pathname.replace(/\/$/, '');
    const onDiscover = path.endsWith('/discover');
    const onExplorer = path.endsWith('/explorer');
    return chat.open && (onDiscover || onExplorer) && assistedSearchEnabled(onDiscover);
  });

  beforeNavigate(({ to, cancel }) => {
    const toMode = routeMode(to?.route.id);
    const notAuthorized =
      exploreMode() !== 'explorer' && toMode === 'explorer' && filterState.hasInvalidFilter;
    const stigmatizing =
      toMode === 'discover' &&
      (filterState.hasGenomicOrSnpFilter || filterState.hasUnallowedFilter);

    if (stigmatizing || notAuthorized) {
      if (stigmatizing) filterState.warning = 'stigmatizing';
      else if (notAuthorized) filterState.warning = 'notAuthorized';

      cancel();
      const active = document.activeElement;
      filterWarningTrigger =
        active instanceof HTMLElement && active !== document.body ? active : undefined;
      filterWarningModal = true;
    }
  });
</script>

<Toaster />
<FilterWarning bind:open={filterWarningModal} returnFocus={filterWarningTrigger} />
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
