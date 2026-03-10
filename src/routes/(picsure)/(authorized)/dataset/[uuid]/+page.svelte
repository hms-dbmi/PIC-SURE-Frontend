<script lang="ts">
  import { page } from '$app/state';

  import { branding } from '$lib/configuration';

  import { QueryStatus, QueryVersion, type DataSet } from '$lib/models/Dataset';
  import { QueryV2, QueryV3 } from '$lib/models/query/Query';
  import { getDataset } from '$lib/stores/Dataset.svelte';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import V2QuerySummary from '$lib/components/query/V2QuerySummary.svelte';
  import V3QuerySummary from '$lib/components/query/V3QuerySummary.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';

  let dataset: DataSet | undefined = $state({
    version: QueryVersion.UNKNOWN,
    uuid: '',
    user: '',
    name: '',
    archived: false,
    metadata: {},
    query: null,
    queryId: '',
    startTime: '',
    rawStartTime: 0,
    status: QueryStatus.UNDEFINED,
  });

  async function loadDataset() {
    if (page.params?.uuid) {
      dataset = await getDataset(page.params.uuid);
    }
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Dataset</title>
</svelte:head>

<Content title="View Dataset" backUrl="/dataset" backTitle="Back to Datasets">
  {#await loadDataset()}
    <Loading />
  {:then}
    {#if dataset?.query && dataset?.queryId}
      <section id="detail-summary-container" class="my-4">
        <h2 class="text-left h4 mb-2 mt-6">Dataset ID Summary</h2>
        <table class="table bg-transparent">
          <tbody>
            <tr>
              <td>Dataset ID Name:</td>
              <td class="text-surface-700" data-testid="dataset-summary-name">{dataset.name}</td>
            </tr>
            <tr>
              <td>Dataset ID:</td>
              <td class="text-surface-700" data-testid="dataset-summary-uuid">
                <span class="monospace">{dataset.queryId}</span>
                <CopyButton
                  data-testid="{dataset.queryId}-copy"
                  useIcon
                  itemToCopy={dataset.queryId}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      {#if dataset.version === QueryVersion.V2}
        <V2QuerySummary query={dataset.query as QueryV2} />
      {:else if dataset.version === QueryVersion.V3}
        <V3QuerySummary query={dataset.query as QueryV3} uuid={dataset.queryId} />
      {:else}
        <ErrorAlert color="warning">Invalid query object.</ErrorAlert>
      {/if}
    {:else}
      <ErrorAlert title="API Error">
        An error occured while retrieving dataset {page.params.uuid}.
      </ErrorAlert>
    {/if}
  {:catch}
    <ErrorAlert title="API Error">
      An error occured while retrieving dataset {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
