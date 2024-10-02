<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {
    hasGenomicFilter,
    hasUnallowedFilter,
    removeGenomicFilters,
    removeUnallowedFilters,
  } from '$lib/stores/Filter.ts';
  import { goto } from '$app/navigation';
  import openTour from '$lib/assets/openTourConfiguration.json';

  function resetQuery() {
    removeGenomicFilters();
    removeUnallowedFilters();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={openTour} />
</Content>
