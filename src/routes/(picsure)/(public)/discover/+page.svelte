<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding, features } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import TourData from '$lib/assets/TourConfiguration.json';

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const Tour: Record<string, any> = TourData;
  const tourName = features.discoverFeautures.openTour;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let openTour: any = undefined;
  if (tourName !== undefined && tourName in Tour) {
    openTour = Tour[tourName];
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={openTour} />
</Content>
