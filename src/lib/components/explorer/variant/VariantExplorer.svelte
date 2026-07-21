<script lang="ts">
  import { onMount } from 'svelte';

  import { ExportType, type VariantResult } from '$lib/models/Variant';
  import { getCountResource } from '$lib/stores/Resources';
  import { getVariantCount, getVariantData } from '$lib/utilities/Variants';
  import { getQueryRequestV3 } from '$lib/utilities/QueryBuilder';
  import { settings } from '$lib/configuration';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import VariantData from '$lib/components/explorer/variant/VariantData.svelte';

  let variantResults: VariantResult[] = $state([]);
  let loading: Promise<void> = $state(Promise.resolve());

  async function loadVariants() {
    const resource = getCountResource();
    const queryRequest = getQueryRequestV3(true, resource.uuid);
    variantResults = [
      {
        name: resource.name,
        exportType: settings.variantExplorer.type || ExportType.Aggregate,
        count: getVariantCount(queryRequest),
        queryRequest,
      },
    ];
    variantResults[0].data = getVariantData(
      variantResults[0].exportType,
      variantResults[0].queryRequest,
    );
  }

  function aggregateChange(checked: boolean) {
    const result = variantResults[0];
    result.exportType = checked ? ExportType.Aggregate : ExportType.Full;
    result.data = getVariantData(result.exportType, result.queryRequest);
  }

  onMount(() => {
    loading = loadVariants();
  });
</script>

{#await loading}
  <Loading ring size="medium" />
{:then}
  {#if variantResults.length === 1}
    {#await variantResults[0].count}
      <Loading ring size="medium" />
    {:then countResult}
      <VariantData
        count={countResult}
        onAggregateToggle={aggregateChange}
        bind:data={variantResults[0].data}
        bind:exportType={variantResults[0].exportType}
      />
    {:catch}
      <ErrorAlert title="Error">An error occured while loading counts and variant data.</ErrorAlert>
    {/await}
  {:else}
    <ErrorAlert title="Error">No resource was found to query for variant data.</ErrorAlert>
  {/if}
{:catch}
  <ErrorAlert title="Error">An error occured while loading variant data.</ErrorAlert>
{/await}
