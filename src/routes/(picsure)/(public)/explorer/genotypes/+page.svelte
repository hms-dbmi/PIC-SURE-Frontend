<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import Content from '$lib/components/Content.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Genotypes</title>
</svelte:head>

<!-- Genomic filtering still lives at /explorer/genome-filter until ALS-12880 moves it here. -->
<Content full>
  <p data-testid="genotypes-placeholder" class="my-8 text-center">
    Genomic filtering is moving to this tab.
  </p>
</Content>
