<script lang="ts">
  import { getDrawerStore } from '@skeletonlabs/skeleton';
  import { getDatasetDetails } from '$lib/services/dictionary';
  import type { DashboardRow } from '$lib/stores/Dashboard';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  const drawerStore = getDrawerStore();

  const datasetId = (($drawerStore.meta.row as DashboardRow)?.dataset_id as string) || '';

  async function getDataset() {
    const res = await getDatasetDetails(datasetId);
    if (res.dashboardDrawerList) {
      let details = res.dashboardDrawerList[0];
      if (details.datasetId) {
        delete details.datasetId;
      }
      return details;
    }
    throw new Error('No dashboardDrawerList found');
  }
</script>

<div>
  {#await getDataset()}
    <div class="flex justify-center items-center h-full">
      <ProgressRadial />
    </div>
  {:then details}
    <ul>
      {#each Object.entries(details) as [key, value]}
        <li>
          <strong>{key}</strong>:
          {#if Array.isArray(value)}
            <ul>
              {#each value as item}
                <li>{item}</li>
              {/each}
            </ul>
          {:else}
            {value}
          {/if}
        </li>
      {/each}
    </ul>
  {:catch}
    <div class="flex justify-center items-center h-full">
      <ErrorAlert title="An Error Occured">
        <p>We're having trouble fetching the dataset details right now. Please try again later.</p>
      </ErrorAlert>
    </div>
  {/await}
</div>
