<script lang="ts">
  import { onMount } from 'svelte';

  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { commonAreaUUID, federatedQueryStatuses } from '$lib/stores/Dataset';
  import { Picsure } from '$lib/paths';
  import * as api from '$lib/api';
  import { getQueryResources, loadResources, resources } from '$lib/stores/Resources';
  import Summary from './Summary.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import { Query } from '$lib/models/query/Query';

  interface Props {
    query: QueryRequestInterface;
    datasetId: string;
    datasetNameInput: string;
    saveable: boolean;
  }

  let { query, datasetId = $bindable(), datasetNameInput = $bindable(), saveable = $bindable() }: Props = $props();
  let federatedQueryResponses: Record<string, string> = $state({});
  let federatedQueryStatusesPromises: Promise<void>[] = $state([]);

  async function createCommonAreaUUID() {
    if ($commonAreaUUID) {
      datasetId = $commonAreaUUID;
      return;
    }
    const uuidQuery = new Query();
    const uuidQueryRequest: QueryRequestInterface = {
      query: uuidQuery,
      resourceUUID: $resources.queryIdGen,
    };
    return api.post(Picsure.Query, uuidQueryRequest).then((res: { picsureResultId: string }) => {
      const commonAreaDatasetId = res.picsureResultId || undefined;
      commonAreaUUID.set(commonAreaDatasetId);
      datasetId = commonAreaDatasetId || '';
      query.commonAreaUUID = commonAreaDatasetId;
    });
  }

  async function queryAsync(query: QueryRequestInterface) {
    query.query.expectedResultType = 'COUNT';
    query['@type'] = 'FederatedQueryRequest';
    return api.post(`${Picsure.Query}?isInstitute=true`, query);
  }

  async function queryStatus(name: string, uuid: string) {
    let interval = 0;
    const queryFragment = `/${uuid}/status?isInstitute=true`;
    const queryResponse: { status: string; responseText?: string } = await api.get(
      `${Picsure.Query}${queryFragment}`,
    );
    if (!queryResponse.status) {
      const serverMsg =
        queryResponse && queryResponse.responseText
          ? JSON.parse(queryResponse.responseText)?.message
          : 'No Message';
      const message = `There was an error preparing your query on ${name}.\nPlease try again later, if the problem persists please reach out to an admin.\nMessage from server: ${serverMsg}`;
      console.dir(queryResponse);
      $federatedQueryStatuses[name] = 'ERROR';
      return;
    } else if (
      queryResponse.status &&
      (queryResponse.status === 'AVAILABLE' ||
        queryResponse.status === 'COMPLETE' ||
        queryResponse.status === 'ERROR')
    ) {
      $federatedQueryStatuses[name] = queryResponse.status;
      return;
    }
    $federatedQueryStatuses[name] = 'PENDING';
    interval = Math.min(interval + 2000, 30000);
    setTimeout(() => {
      queryStatus(name, uuid);
    }, interval);
  }

  async function callInstituteNodes() {
    getQueryResources().forEach(async (resource) => {
      const resourceQuery = structuredClone(query);
      resourceQuery.resourceUUID = resource.uuid;
      const queryResponse: { picsureResultId: string } = await queryAsync(resourceQuery);
      federatedQueryResponses[resource.name] = queryResponse.picsureResultId;
    });
  }

  onMount(async () => {
    await loadResources();
    await createCommonAreaUUID();
    
    datasetId = $commonAreaUUID || '';
    await callInstituteNodes();
    Object.entries(federatedQueryResponses).map(async ([resourceName, uuid]) => {
      federatedQueryStatusesPromises.push(queryStatus(resourceName, uuid));
    });
  });
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  {#await Promise.all(federatedQueryStatusesPromises).then(() => {
    saveable = true;
  })}
    <Loading ring size="medium" label="Preparing datasets..." />
  {:then}
    <div class="w-full h-full m-2 card p-4">
      <header class="card-header">
        Common Area Save the information in your final data export by clicking the Save Dataset ID
        button. Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or
        manage your Dataset IDs.
      </header>
      <hr />
      <div class="card-body p-4 flex flex-col justify-center items-center">
        <div>
          <div class="flex items-center m-2">
            <label for="dataset-name" class="font-bold mr-2">Dataset Name:</label>
            <input
              type="text"
              id="dataset-name"
              class="input w-80"
              placeholder="Enter a name"
              bind:value={datasetNameInput}
              required
            />
          </div>
          <div class="flex items-center m-2">
            <div class="flex items-center">
              <label for="dataset-id" class="font-bold mr-2">Dataset ID:</label>
              {#if !datasetId}
                <Loading ring size="micro" label="Saving dataset..." />
              {:else}
                <div id="dataset-id" class="mr-4">{datasetId}</div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/await}
</section>
