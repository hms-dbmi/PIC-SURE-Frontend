<script lang="ts">
  import { getDatasetDetails } from '$lib/stores/Dictionary';
  import { activeRow } from '$lib/stores/Dashboard';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '../Loading.svelte';

  const datasetId = ($activeRow?.dataset_id as string) || '';
  const title = ($activeRow?.name as string) || '';
  const link = ($activeRow?.additional_info_link as string) || '';

  async function getDataset() {
    const details = await getDatasetDetails(datasetId);
    if (!details || Object.keys(details).length === 0) throw new Error('No details found');
    if (details.datasetId) {
      delete details.datasetId;
    }
    if (details.studyFullname) {
      delete details.studyFullname;
    }
    return details;
  }
</script>

{#if title}
  <h2 data-testid="drawer-title" class="text-2xl font-bold ml-4">{title}</h2>
{/if}
<hr />
{#await getDataset()}
  <Loading ring size="medium" />
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
        class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
        target="_blank"
        onclick={(e) => e.stopPropagation()}>More Info</a
      >
    </div>
  {/if}
{:catch}
  <ErrorAlert title="An Error Occured">
    We're having trouble fetching the dataset details right now. Please try again later.
  </ErrorAlert>
{/await}
