<script lang="ts">
  import Content from '#lib/shell/Content.svelte';
  import Visualizations from '#lib/explorer/visualizations/Visualizations.svelte';
  import { config } from '#lib/config/config.svelte.ts';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Distributions</title>
</svelte:head>

<Content full backUrl="/explorer" backTitle="Back to Explore" title="Variable Distributions">
  <Visualizations />
</Content>
