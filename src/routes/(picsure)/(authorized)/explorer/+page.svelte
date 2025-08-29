<script lang="ts">
  import { branding, settings } from '$lib/stores/Configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import TourData from '$lib/assets/TourConfiguration.json';

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const Tour: Record<string, any> = TourData;

  const tourName = $derived($settings.tour.auth);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let authTour: any = $derived(
    tourName !== undefined && tourName in Tour ? Tour[tourName] : undefined,
  );
</script>

<svelte:head>
  <title>{$branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={authTour} />
</Content>
