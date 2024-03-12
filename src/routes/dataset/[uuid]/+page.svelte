<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { page } from '$app/stores';
  import type { DataSet } from '$lib/models/Dataset';
  import DataSetStore from '$lib/stores/Dataset';
  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  const { getDataset } = DataSetStore;

  let dataset: DataSet;

  async function loadDataset() {
    dataset = await getDataset($page.params.uuid);
  }
</script>

<Content title="View Dataset">
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
    <section id="detail-filters-container" class="m-3">
      <h2 class="text-left my-1">Filters Applied</h2>
      <ul data-testid="dataset-summary-filters" class="primary-list">
        <li>query.categoryFilters: {JSON.stringify(dataset.query?.categoryFilters)}</li>
        <li>query.numericFilters: {JSON.stringify(dataset.query?.numericFilters)}</li>
        <li>query.variantInfoFilters: {JSON.stringify(dataset.query?.variantInfoFilters)}</li>
      </ul>
    </section>
    <section id="detail-variables-container" class="m-3">
      <h2 class="text-left my-1">Additional Variables Included in Dataset</h2>
      <ul data-testid="dataset-summary-variables" class="primary-list">
        <li>query.fields: {JSON.stringify(dataset.query?.fields)}</li>
      </ul>
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
