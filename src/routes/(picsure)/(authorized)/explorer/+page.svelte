<script lang="ts">
  import { branding, features } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import TourData from '$lib/assets/TourConfiguration.json';

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const Tour: Record<string, any> = TourData;

  const tourName = features.explorer.authTour;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let authTour: any = $state(undefined);
  if (tourName !== undefined && tourName in Tour) {
    authTour = Tour[tourName];
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={authTour} />
</Content>
