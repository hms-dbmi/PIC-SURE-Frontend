<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import TourData from '$lib/assets/TourConfiguration.json';
  import type { TourDataType } from '$lib/models/Tour';

  const Tour: Record<string, TourDataType> = TourData;
  let tourName = $derived(config.settings.tour.auth);

  let authTour: TourDataType = $derived(
    tourName !== undefined && tourName in Tour ? Tour[tourName] : Tour['NHANES-Auth'],
  );
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={authTour} />
</Content>
