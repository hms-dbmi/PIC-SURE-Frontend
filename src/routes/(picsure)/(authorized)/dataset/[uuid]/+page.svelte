<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { page } from '$app/stores';

  import type { DataSet } from '$lib/models/Dataset';
  import DataSetStore from '$lib/stores/Dataset';
  import { branding } from '$lib/configuration';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import QuerySummary from '$lib/components/QuerySummary.svelte';

  const { getDataset } = DataSetStore;

  let dataset: DataSet;

  async function loadDataset() {
    dataset = await getDataset($page.params.uuid);
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Dataset</title>
</svelte:head>

<Content title="View Dataset" backUrl="/dataset" backTitle="Back to Datasets">
  {#await loadDataset()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="detail-summary-container" class="m-3">
      <h2 class="text-left my-1">Dataset ID Summary</h2>
      <table class="table bg-transparent">
        <tr>
          <td>Dataset ID Name:</td>
          <td data-testid="dataset-summary-name">{dataset.name}</td>
        </tr>
        <tr>
          <td>Dataset ID:</td>
          <td data-testid="dataset-summary-uuid">{dataset.uuid}</td>
        </tr>
      </table>
    </section>
    <QuerySummary query={dataset.query} />
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
