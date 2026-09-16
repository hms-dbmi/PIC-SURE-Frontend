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
  import { isDiscoverSection, isExploreSection } from '$lib/explorer/searchChrome';

  import Shell from '$lib/components/Shell.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import DashboardDrawer from '$lib/components/dashboard/DashboardDrawer.svelte';
  import FilterWarning from '$lib/components/explorer/FilterWarning.svelte';

  let { children }: { children?: Snippet } = $props();
  let filterWarningModal: boolean = $state(false);

  onMount(() => {
    document.body.classList.add('started');
  });

  // Which section a path belongs to is decided by segment, not substring. Below the section
  // root the segments are dictionary data - a variable detail URL carries its dataset - so
  // `/discover/variable/explorer/...` would otherwise read as being inside Explore already and
  // let an unauthorised filter through the notAuthorized arm without a warning.
  beforeNavigate(({ to, cancel }) => {
    const from = page.url.pathname;
    const target = to?.url.pathname ?? '';
    const notAuthorized = !isExploreSection(from) && isExploreSection(target) && $hasInvalidFilter;
    const stigmatizing = isDiscoverSection(target) && ($hasGenomicFilter || $hasUnallowedFilter);

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
    <Navigation />
  {/snippet}
  {@render children?.()}
  {#snippet pageFooter()}
    <Footer />
  {/snippet}
</Shell>
