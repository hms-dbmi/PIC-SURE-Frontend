<script lang="ts">
  import Content from '#lib/shell/Content.svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import Explorer from '#lib/explorer/components/Explorer.svelte';
  import { resolveTour } from '#lib/explorer/components/tour/tour.ts';

  let openTour = $derived(resolveTour(config.settings.tour.open, 'BDC-Open'));
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={openTour} />
</Content>
