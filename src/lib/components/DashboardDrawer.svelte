<script lang="ts">
  import { getDrawerStore } from '@skeletonlabs/skeleton';
  import { getDatasetDetails } from '$lib/services/dictionary';
  import type { DashboardRow } from '$lib/stores/Dashboard';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  const drawerStore = getDrawerStore();

  const datasetId = (($drawerStore.meta.row as DashboardRow)?.dataset_id as string) || '';
  const title = (($drawerStore.meta.row as DashboardRow)?.name as string) || '';

  async function getDataset() {
    const res = await getDatasetDetails(datasetId);
    if (res.dashboardDrawerList) {
      let details = res.dashboardDrawerList[0];
      if (details.datasetId) {
        delete details.datasetId;
      }
      if (details.studyFullname) {
        delete details.studyFullname;
      }
      return details;
    }
    throw new Error('No dashboardDrawerList found');
  }
</script>

<div>
  {#if title}
    <h2 class="text-2xl font-bold ml-4">{title}</h2>
  {/if}
  {#await getDataset()}
    <div class="flex justify-center items-center h-full">
      <ProgressRadial />
    </div>
  {:then details}
    <ul class="m-4">
      {#each Object.entries(details) as [key, value]}
        {#if value}
          <li class="m-2">
            <strong class="capitalize"
              >{key
                .replace(/([A-Z])/g, ' $1')
                .toLowerCase()
                .trim()}</strong
            >:
            {#if Array.isArray(value)}
              <ul class="list-disc">
                {#each value as item}
                  {#if item}
                    <li class="ml-8">{item}</li>
                  {/if}
                {/each}
              </ul>
            {:else}
              {value}
            {/if}
          </li>
        {/if}
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

<style>
</style>
