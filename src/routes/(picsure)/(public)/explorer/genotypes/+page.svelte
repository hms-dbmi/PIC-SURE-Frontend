<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import Content from '$lib/components/Content.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Genotypes</title>
</svelte:head>

<!-- Placeholder. ALS-12880 moves the genomic filtering UI here and retires
     /explorer/genome-filter; until then that route is still the working one. -->
<Content full>
  <p data-testid="genotypes-placeholder" class="my-8 text-center">
    Genomic filtering is moving to this tab.
  </p>
</Content>
