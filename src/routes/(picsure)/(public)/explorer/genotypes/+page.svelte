<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import Content from '$lib/components/Content.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Genotypes</title>
</svelte:head>

<!-- Placeholder body. The genomic filtering UI still lives on /explorer/genome-filter, reached
     from the Genomic Filtering button, and moves here in a later change. -->
<Content full>
  <p data-testid="genotypes-placeholder" class="my-8 text-center">
    Genomic filtering is moving to this tab.
  </p>
</Content>
