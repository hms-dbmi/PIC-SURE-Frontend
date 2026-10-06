<script lang="ts">
  import { config } from '#lib/configuration.svelte.ts';
  import Content from '#lib/components/Content.svelte';
  import Explorer from '#lib/components/explorer/Explorer.svelte';
  import { resolveTour } from '#lib/utilities/Tour.ts';

  let authTour = $derived(resolveTour(config.settings.tour.auth, 'NHANES-Auth'));
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={authTour} />
</Content>
