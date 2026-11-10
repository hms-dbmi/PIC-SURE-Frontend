<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { config } from '#lib/config/config.svelte.ts';
  import { isToastShowing, toaster } from '#lib/ui/toaster.ts';

  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

  import Content from '#lib/shell/Content.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import VariantExplorer from '#lib/explorer/variant/VariantExplorer.svelte';
  import { filterState } from '#lib/query/filters.svelte.ts';

  onMount(() => {
    if (filterState.queryFilters.genomicFilters.length === 0) {
      if (!isToastShowing('no-query')) {
        toaster.error({
          id: 'no-query',
          title: 'No query provided. Please add a genomic filter to explore variant data.',
          closable: true,
        });
      }
      goto(resolve('explorer'));
    } else {
      explorerPanel.hide();
    }
    return () => explorerPanel.show();
  });
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
