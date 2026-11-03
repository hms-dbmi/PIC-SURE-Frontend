<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import Explorer from '#lib/explorer/components/Explorer.svelte';
  import { resolveTour } from '#lib/explorer/components/tour/tour.ts';

  let authTour = $derived(resolveTour(config.settings.tour.auth, 'NHANES-Auth'));
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={authTour} />
</Content>
