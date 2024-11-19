<script lang="ts">
  import { getDrawerStore } from '@skeletonlabs/skeleton';
  import { getDatasetDetails } from '$lib/services/dictionary';
  import type { DashboardRow } from '$lib/stores/Dashboard';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  const drawerStore = getDrawerStore();

  const datasetId = (($drawerStore.meta.row as DashboardRow)?.dataset_id as string) || '';
  const title = (($drawerStore.meta.row as DashboardRow)?.name as string) || '';
  const link = (($drawerStore.meta.row as DashboardRow)?.additional_info_link as string) || '';
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

{#if title}
  <h2 data-testid="drawer-title" class="text-2xl font-bold ml-4">{title}</h2>
{/if}
<hr class="m-4 border-t-2 border-gray-200" />
{#await getDataset()}
  <div class="flex justify-center items-center h-full">
    <ProgressRadial />
  </div>
{:then details}
  <ul data-testid="drawer-details" class="m-4 p-4">
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
  {#if link}
    <div class="flex justify-center items-center mb-4">
      <a
        href={link || '#'}
        on:click|stopPropagation
        class="btn variant-ghost-primary hover:variant-filled-primary"
        target="_blank">More Info</a
      >
    </div>
  {/if}
{:catch}
  <div class="flex justify-center items-center">
    <ErrorAlert title="An Error Occured">
      <p>We're having trouble fetching the dataset details right now. Please try again later.</p>
    </ErrorAlert>
  </div>
{/await}
