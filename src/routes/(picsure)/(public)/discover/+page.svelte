<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { config } from '$lib/configuration.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import TourData from '$lib/assets/TourConfiguration.json';
  import type { TourDataType } from '$lib/models/Tour';

  const Tour: Record<string, TourDataType> = TourData;
  const tourName = $derived(config.settings.tour.open);

  let openTour: TourDataType = $derived(
    tourName !== undefined && tourName in Tour ? Tour[tourName] : Tour['BDC-Open'],
  );
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={openTour} />
</Content>
