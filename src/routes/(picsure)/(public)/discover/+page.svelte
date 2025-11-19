<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { config } from '$lib/configuration.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import TourData from '$lib/assets/TourConfiguration.json';

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const Tour: Record<string, any> = TourData;
  const tourName = config.settings.tour.open;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let openTour: any = $state(undefined);
  if (tourName !== undefined && tourName in Tour) {
    openTour = Tour[tourName];
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={openTour} />
</Content>
