<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { getDatasetDetails } from '#lib/api/picsure/dictionary.ts';
  import type { DashboardRow } from './dashboard.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  interface Props {
    row: DashboardRow;
  }

  let { row }: Props = $props();

  const datasetId = $derived((row.dataset_id as string) || '');
  const title = $derived((row.name as string) || '');
  const link = $derived((row.additional_info_link as string) || '');

  async function getDataset(datasetId: string) {
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
  <h2 data-testid="dashboard-drawer-title" class="font-bold ml-4">{title}</h2>
{/if}
<hr />
{#await getDataset(datasetId)}
  <Loading ring size="medium" />
{:then details}
  <ul data-testid="dashboard-drawer-details" class="m-4 p-4">
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
      <Button
        variant="tonal"
        href={link || '#'}
        rel="external"
        target="_blank"
        onclick={(e) => {
          e.stopPropagation();
          log(createLog('ACTION', 'dashboard.more_info_panel', { dataset: datasetId, url: link }));
        }}>More Info</Button
      >
    </div>
  {/if}
{:catch}
  <ErrorAlert title="An Error Occured">
    We're having trouble fetching the dataset details right now. Please try again later.
  </ErrorAlert>
{/await}
