<script lang="ts">
  import { page } from '$app/state';

  import type { DataSet } from '$lib/models/Dataset';
  import { getDataset } from '$lib/stores/Dataset';
  import { branding } from '$lib/configuration';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import QuerySummary from '$lib/components/QuerySummary.svelte';
  import Loading from '$lib/components/Loading.svelte';

  let dataset: DataSet | undefined = $state({
    uuid: '',
    user: '',
    name: '',
    archived: false,
    metadata: {},
    query: {},
    queryId: '',
    startTime: '',
    rawStartTime: 0,
  });

  async function loadDataset() {
    dataset = await getDataset(page.params.uuid);
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Dataset</title>
</svelte:head>

<Content title="View Dataset" backUrl="/dataset" backTitle="Back to Datasets">
  {#await loadDataset()}
    <Loading />
  {:then}
    <section id="detail-summary-container" class="m-3">
      <h2 class="text-left my-1">Dataset ID Summary</h2>
      <table class="table bg-transparent">
        <tbody>
          <tr>
            <td>Dataset ID Name:</td>
            <td data-testid="dataset-summary-name">{dataset?.name}</td>
          </tr>
          <tr>
            <td>Dataset ID:</td>
            <td data-testid="dataset-summary-uuid">{dataset?.uuid}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <QuerySummary query={dataset?.query} />
  {:catch}
    <ErrorAlert title="API Error">
      An error occured while retrieving dataset {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
