<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { config } from '$lib/configuration.svelte';
  import { isToastShowing, toaster } from '$lib/toaster';

  import type { QueryV2 } from '$lib/models/query/Query';
  import { panelOpen } from '$lib/stores/SidePanel';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import VariantExplorer from '$lib/components/explorer/variant/VariantExplorer.svelte';
  import { getQueryRequestV2 } from '$lib/utilities/QueryBuilder';

  onMount(() => {
    if (!(getQueryRequestV2(true).query as QueryV2).hasGenomicFilter()) {
      if (!isToastShowing('no-query')) {
        toaster.error({
          id: 'no-query',
          title: 'No query provided. Please add a genomic filter to explore variant data.',
          closable: true,
        });
      }
      goto('/explorer');
    } else {
      $panelOpen = false;
    }
  });
  onDestroy(() => ($panelOpen = true));
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Variant Explorer</title>
</svelte:head>

<Content full backUrl="/explorer" backTitle="Back to Explore">
  <h2 class="text-center clear-both">Variant Explorer</h2>
  {#if config.features.explorer.variantExplorer}
    <VariantExplorer />
  {:else}
    <ErrorAlert title="Error">
      Variant explorer feature has not been enabled in this environment. Please contact an admin if
      you have any questions.
    </ErrorAlert>
  {/if}
</Content>
