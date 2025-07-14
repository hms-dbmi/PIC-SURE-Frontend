<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { branding, features } from '$lib/configuration';
  import { toaster } from '$lib/toaster';

  import { panelOpen } from '$lib/stores/SidePanel';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import VariantExplorer from '$lib/components/explorer/variant/VariantExplorer.svelte';
  import { getQueryRequest } from '$lib/utilities/QueryBuilder';

  onMount(() => {
    if (!getQueryRequest(true).query.hasFilter()) {
      toaster.error({
        title: 'No query provided. Please add a genomic filter to explore variant data.',
      });
      goto('/explorer');
    } else {
      $panelOpen = false;
    }
  });
  onDestroy(() => ($panelOpen = true));
</script>

<svelte:head>
  <title>{branding.applicationName} | Variant Explorer</title>
</svelte:head>

<Content full backUrl="/explorer" backTitle="Back to Explore">
  <h2 class="text-center clear-both">Variant Explorer</h2>
  {#if features.explorer.variantExplorer}
    <VariantExplorer />
  {:else}
    <ErrorAlert title="Error">
      Variant explorer feature has not been enabled in this environment. Please contact an admin if
      you have any questions.
    </ErrorAlert>
  {/if}
</Content>
