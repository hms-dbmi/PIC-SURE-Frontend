<script lang="ts">
  import ExportStore from '$lib/stores/Export';
  import { onMount } from 'svelte';
  import { filters } from '$lib/stores/Filter';
  import { features } from '$lib/configuration';
  import { totalParticipants, resultCounts, loadPatientCount } from '$lib/stores/ResultStore';
  import type { StatResultMap } from '$lib/models/Stat';
  import Loading from '$lib/components/Loading.svelte';
  import { federatedQueryStatuses } from '$lib/stores/Dataset';
  let { exports } = ExportStore;

  let participantsCount = $derived($totalParticipants);
  let variablesCount = $derived($filters.length + $exports.length);
  let dataPoints = $derived(
    typeof participantsCount === 'number' ? participantsCount * variablesCount : 0,
  );

  let resultCountMap: StatResultMap = $state({});

  function getStatusIcon(status: string) {
    switch (status) {
      case 'AVAILABLE':
      case 'COMPLETE':
      case 'ERROR':
        return 'fa-solid fa-circle-check text-success-500';
      default:
        return 'fa-solid fa-circle-check text-success-500';
    }
  }

  let siteStatusIcons = $derived(
    $federatedQueryStatuses
      ? Object.fromEntries(
          Object.entries($federatedQueryStatuses).map(([siteName, status]) => [
            siteName,
            getStatusIcon(status),
          ]),
        )
      : {},
  );

  onMount(async () => {
    if (!features.federated) return;

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

{#if features.federated && Object.keys($federatedQueryStatuses).length === 0 && Object.keys(resultCountMap).length > 0}
  <div id="site-indicators" class="grid grid-cols-3 gap-y-2 gap-x-6">
    {#each Object.entries(resultCountMap) as [siteName, value]}
      <div id="site-indicator">
        {#await value}
          <Loading size="micro" />
        {:then value}
          <i class="fa-solid fa-circle-check text-success-500"></i>
          <span id="site-indicator-label" class="uppercase">{siteName}</span>
          <span id="site-indicator-value">({value})</span>
        {:catch error}
          <i class="fa-solid fa-circle-xmark text-error-500"></i>
          <span id="site-indicator-label">{siteName}</span>
        {/await}
      </div>
    {/each}
  </div>
{/if}

{#if features.federated && $federatedQueryStatuses && Object.keys($federatedQueryStatuses).length > 0 && Object.keys(resultCountMap).length > 0}
  <div id="site-indicators" class="grid grid-cols-3 gap-y-2 gap-x-6">
    {#each Object.entries($federatedQueryStatuses) as [siteName]}
      <div id="site-indicator">
        <i class={siteStatusIcons[siteName]}></i>
        <span id="site-indicator-label">{siteName}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  #stats {
    border-bottom: 1px solid #888888;
  }
</style>
