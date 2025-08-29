<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import Visualizations from '$lib/components/explorer/Visualizations.svelte';
  import { branding } from '$lib/stores/Configuration';
</script>

<svelte:head>
  <title>{$branding.applicationName} | Distributions</title>
</svelte:head>

<Content full backUrl="/discover" backTitle="Back to Discover" title="Variable Distributions">
  <Visualizations />
</Content>
