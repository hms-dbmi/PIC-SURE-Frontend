<script lang="ts">
  import Content from '#lib/components/Content.svelte';
  import { config } from '#lib/configuration.svelte.ts';
  import Explorer from '#lib/components/explorer/Explorer.svelte';
  import { resolveTour } from '#lib/utilities/Tour.ts';

  let openTour = $derived(resolveTour(config.settings.tour.open, 'BDC-Open'));
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={openTour} />
</Content>
