<script lang="ts">
    import Content from "$lib/components/Content.svelte";
    import Visualizations from "$lib/components/explorer/Visualizations.svelte";
    import { branding } from "$lib/configuration";
</script>

<svelte:head>
  <title>{branding.applicationName} | Distributions</title>
</svelte:head>

<Content full={true} backUrl="/explorer" backTitle="Back to Explore" title="Variable Distributions">
  <Visualizations />
</Content>
