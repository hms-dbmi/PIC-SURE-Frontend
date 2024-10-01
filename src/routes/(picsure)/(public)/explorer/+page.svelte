<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import { hasInvalidFilter } from '$lib/stores/Filter.ts';
    import { beforeNavigate } from '$app/navigation';
  import { panelOpen } from '$lib/stores/SidePanel';

  beforeNavigate(() => {
    panelOpen.set(false);
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
