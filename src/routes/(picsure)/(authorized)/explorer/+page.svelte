<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  <Explorer tourConfig={authTour} />
</Content>
