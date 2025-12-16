<script lang="ts">
  import ExportStore from '$lib/stores/Export';
  import { onMount } from 'svelte';
  import { filters } from '$lib/stores/Filter';
  import { features } from '$lib/configuration';
  import { totalParticipants, resultCounts, loadPatientCount } from '$lib/stores/ResultStore';
  import type { StatResultMap, StatValue } from '$lib/models/Stat';
  import type { FederatedResourceInfo } from '$lib/stores/Dataset';
  import Loading from '$lib/components/Loading.svelte';
  import { federatedQueryMap } from '$lib/stores/Dataset';
  import type { AnyRecordOfFilterInterface } from '$lib/models/Filter.svelte';

  interface SiteInfo extends FederatedResourceInfo {
    count?: Promise<StatValue>;
  }
  let { exports } = ExportStore;

  let participantsCount = $derived($totalParticipants);
  let anyRecordsOfCount = $derived.by(() => {
    const anyRecordsOfFilters = $filters.filter(
      (filter) => filter.filterType === 'AnyRecordOf',
    ) as AnyRecordOfFilterInterface[];
    return (
      anyRecordsOfFilters.reduce((acc, filter) => acc + filter.concepts.length, 0) -
      anyRecordsOfFilters.length
    );
  });
  let variablesCount = $derived($filters.length + $exports.length + anyRecordsOfCount);
  let dataPoints = $derived(
    typeof participantsCount === 'number' ? participantsCount * variablesCount : 0,
  );

  let resultCountMap: StatResultMap = $state({});

  function getStatusIcon(info: SiteInfo) {
    const status = info?.status !== undefined ? info?.status : info.count ? 'COMPLETE' : 'ERROR';
    switch (status) {
      case 'AVAILABLE':
      case 'COMPLETE':
        return 'fa-solid fa-circle-check text-success-500';
      case 'ERROR':
        return 'fa-solid fa-circle-xmark text-error-500';
      case 'PENDING':
        return 'fa-solid fa-clock text-warning-500';
      default:
        return 'fa-solid fa-circle text-surface-500';
    }
  }

  let siteMapsCombined = $derived.by(() => {
    const combined: Record<string, SiteInfo> = {};

    Object.entries($federatedQueryMap).forEach(([siteName, info]) => {
      combined[siteName] = { ...info };
    });

    // Merge resultCountMap into the combined map
    Object.entries(resultCountMap).forEach(([siteName, count]) => {
      if (combined[siteName]) {
        combined[siteName].count = count;
      } else {
        combined[siteName] = { count };
      }
    });

    return combined;
  });

  let siteStatusIcons = $derived(
    siteMapsCombined
      ? Object.fromEntries(
          Object.entries(siteMapsCombined).map(([siteName, info]) => [
            siteName,
            getStatusIcon(info),
          ]),
        )
      : {},
  );

  onMount(async () => {
    if ($resultCounts.length === 0) {
      await loadPatientCount(false);
    }

    const patientCountEntry = $resultCounts.find((entry) => entry.key === 'query:patientCount');
    if (patientCountEntry) {
      resultCountMap = patientCountEntry.result;
    }
  });
</script>

<div id="stats" class="w-full flex justify-evenly mb-5 pb-2">
  <div id="summary" class="w-full grid grid-flow-col auto-cols-auto">
    <div class="text-xl">
      <label for="summary" class="mr-8 font-bold">Summary:</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="participants" class="mr-2">{participantsCount}</span>
      <label for="participants">Participants</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="variables" class="mr-2">{variablesCount}</span>
      <label for="variables">Variables</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="dataPoints" class="mr-2">{dataPoints}</span>
      <label for="dataPoints">Data Points</label>
    </div>
  </div>
</div>

{#if features.federated && siteMapsCombined && Object.keys(siteMapsCombined).length > 0}
  <div id="site-indicators" class="grid grid-cols-3 gap-y-2 gap-x-6">
    {#each Object.entries(siteMapsCombined) as [siteName, info]}
      <div id="site-indicator">
        {#if info?.status === 'PENDING'}
          <Loading size="micro" label={`${siteName}`} />
        {:else if info?.count}
          {#await info?.count}
            <Loading size="micro" label={`${siteName}`} />
          {:then count}
            <i class={siteStatusIcons[siteName]}></i>
            <span id="site-indicator-label" class="uppercase">{siteName}</span>
            <span id="site-indicator-value" class="ml-1">({count})</span>
          {:catch}
            <i class="fa-solid fa-circle-xmark text-error-500"></i>
            <span id="site-indicator-label">{siteName}</span>
          {/await}
        {:else}
          <i class={siteStatusIcons[siteName]}></i>
          <span id="site-indicator-label" class="uppercase">{siteName}</span>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  #stats {
    border-bottom: 1px solid #888888;
  }
</style>
