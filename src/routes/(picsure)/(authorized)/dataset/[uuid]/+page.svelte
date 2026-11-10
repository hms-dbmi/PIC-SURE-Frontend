<script lang="ts">
  import { page } from '$app/state';

  import { consentDeniedMessage } from '#lib/api/errors.ts';
  import { config } from '#lib/config/config.svelte.ts';

  import { QueryVersion, type DataSet } from '#lib/datasets/dataset.ts';
  import { getDataset } from '#lib/datasets/datasets.svelte.ts';

  import Content from '#lib/shell/Content.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import QuerySummary from '#lib/datasets/components/QuerySummary.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import CopyButton from '#lib/ui/CopyButton.svelte';

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
    status: 'UNDEFINED',
  });

  async function loadDataset() {
    if (page.params?.uuid) {
      dataset = await getDataset(page.params.uuid);
    }
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Dataset</title>
</svelte:head>

<Content title="View Dataset" backUrl="/dataset" backTitle="Back to Datasets">
  {#await loadDataset()}
    <Loading />
  {:then}
    {#if dataset?.queryId}
      <section data-testid="dataset-summary-container" class="my-4">
        <h2 class="text-left h4 mb-2 mt-6">Dataset ID Summary</h2>
        <table class="table">
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
                  data-testid="dataset-query-copy-{dataset.queryId}"
                  useIcon
                  itemToCopy={dataset.queryId}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    {/if}
    {#if dataset?.query && dataset?.queryId}
      <QuerySummary query={dataset.query} version={dataset.version} name={dataset.name} />
    {:else}
      <ErrorAlert color="warning">Invalid query object.</ErrorAlert>
    {/if}
  {:catch error}
    <ErrorAlert title="API Error">
      {consentDeniedMessage(error) ??
        `An error occurred while retrieving dataset ${page.params.uuid}.`}
    </ErrorAlert>
  {/await}
</Content>
