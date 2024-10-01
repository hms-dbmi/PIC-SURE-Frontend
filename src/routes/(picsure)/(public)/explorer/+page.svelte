<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import { hasInvalidFilter } from '$lib/stores/Filter.ts';
    import { beforeNavigate } from '$app/navigation';
  import { panelOpen } from '$lib/stores/SidePanel';

  import { beforeNavigate } from '$app/navigation';
  import { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter } from '$lib/stores/Filter.ts';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import FilterWarning from '$lib/components/FilterWarning.svelte';

  const modalStore = getModalStore();

  beforeNavigate((nav) => {
    console.log(nav);
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

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  {#if $hasInvalidFilter}
    <div>Invalid filters</div>
  {:else}
    <Explorer tourConfig={authTour} />
  {/if}
</Content>
