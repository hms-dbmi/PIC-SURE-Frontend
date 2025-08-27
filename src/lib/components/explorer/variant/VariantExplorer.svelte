<script lang="ts">
  import { onMount } from 'svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

  import { ExportType, type VariantResult } from '$lib/models/Variant';
  import {
    loading as resourcesPromise,
    loadResources,
    getQueryResources,
  } from '$lib/stores/Resources';
  import { getVariantCount, getVariantData } from '$lib/utilities/Variants';
  import { getQueryRequest } from '$lib/utilities/QueryBuilder';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import VariantData from '$lib/components/explorer/variant/VariantData.svelte';

  let variantResults: VariantResult[] = $state([]);
  let tabGroup = $state('');
  let loading: Promise<void> = $state(Promise.resolve());

  async function loadVariants() {
    await $resourcesPromise;

    variantResults = getQueryResources().map((resource) => {
      const queryRequest = getQueryRequest(true, resource.uuid);
      return {
        name: resource.name,
        exportType: ExportType.Aggregate,
        count: getVariantCount(queryRequest),
        queryRequest,
      };
    });
  }

  function changeTabGroup(newTab: string) {
    tabGroup = newTab;
    const tabResult = variantResults.find((result) => result.name === tabGroup);
    if (tabResult && !tabResult.data) {
      tabResult.data = getVariantData(tabResult.exportType, tabResult.queryRequest);
    }
  }

  function aggregateChange(index: number) {
    const result = variantResults[index];
    return (checked: boolean) => {
      result.exportType = checked ? ExportType.Aggregate : ExportType.Full;
      result.data = getVariantData(result.exportType, result.queryRequest);
    };
  }

  function shortNumber(count: number) {
    const tril = 1000000000000;
    const bil = 1000000000;
    const mil = 1000000;
    const thou = 1000;

    const toFixed = (val: number, mod: number) =>
      val % mod > 0 ? (val / mod).toFixed(1) : Math.round(val / mod);
    if (count >= tril) {
      return '~' + toFixed(count, tril) + 'T';
    } else if (count >= bil) {
      return '~' + toFixed(count, bil) + 'B';
    } else if (count >= mil) {
      return '~' + toFixed(count, mil) + 'M';
    } else if (count >= thou) {
      return '~' + toFixed(count, thou) + 'K';
    }
    return count.toString();
  }

  onMount(() => {
    loadResources();
    loading = loadVariants().then(() => {
      tabGroup = variantResults[0].name;
      variantResults[0].data = getVariantData(
        variantResults[0].exportType,
        variantResults[0].queryRequest,
      );
    });
  });
</script>

{#await loading}
  <Loading ring size="medium" />
{:then}
  {#if variantResults.length > 1}
    <Tabs value={tabGroup} onValueChange={(e) => changeTabGroup(e.value)}>
      {#snippet list()}
        {#each variantResults as { name, count }}
          <Tabs.Control value={name}>
            <div class="flex items-center">
              <span class="font-bold">{name}</span>
              {#await count}
                <span class="float-right"><Loading ring size="micro" /></span>
              {:then countValue}
                <span class="text-xs ml-1">({shortNumber(countValue)})</span>
              {:catch}
                <i class="fa-solid fa-triangle-exclamation text-error-500"></i>
                <span class="sr-only">Error</span>
              {/await}
            </div>
          </Tabs.Control>
        {/each}
      {/snippet}
      {#snippet content()}
        {#each variantResults as result, index}
          {@const { name, count } = result}
          <Tabs.Panel value={name}>
            {#await count}
              <Loading ring size="medium" />
            {:then countResult}
              <VariantData
                count={countResult}
                onAggregateToggle={aggregateChange(index)}
                bind:data={variantResults[index].data}
                bind:exportType={variantResults[index].exportType}
              />
            {:catch}
              <ErrorAlert title="Error"
                >An error occured while loading counts and variant data.</ErrorAlert
              >
            {/await}
          </Tabs.Panel>
        {/each}
      {/snippet}
    </Tabs>
  {:else if variantResults.length === 1}
    {#await variantResults[0].count}
      <Loading ring size="medium" />
    {:then countResult}
      <VariantData
        count={countResult}
        onAggregateToggle={aggregateChange(0)}
        bind:data={variantResults[0].data}
        bind:exportType={variantResults[0].exportType}
      />
    {:catch}
      <ErrorAlert title="Error">An error occured while loading counts and variant data.</ErrorAlert>
    {/await}
  {:else}
    <ErrorAlert title="Error">No resources were found to query for variant data.</ErrorAlert>
  {/if}
{:catch}
  <ErrorAlert title="Error">An error occured while loading resource list.</ErrorAlert>
{/await}
