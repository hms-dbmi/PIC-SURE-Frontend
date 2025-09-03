<script lang="ts">
  import { onMount } from 'svelte';
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import type { DataSetResponse } from '$lib/models/Dataset';
  import type { ExpectedResultType } from '$lib/models/query/Query.ts';
  import * as api from '$lib/api';
  import { Picsure } from '$lib/paths';
  import { exports } from '$lib/stores/Export';
  import { stepperState } from '$lib/stores/Stepper';

  interface Props {
    query: QueryRequestInterface;
    datasetId: string;
    datasetNameInput: string;
    activeType: ExpectedResultType | undefined;
    saveable: boolean;
  }

  let {
    query,
    datasetId = $bindable(),
    datasetNameInput = $bindable(),
    activeType,
    saveable = $bindable(),
  }: Props = $props();
  const PROMISE_WAIT_INTERVAL = 7;
  let processingMessage: string = $state('');
  let datasetIdPromise: Promise<void | DataSetResponse> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());

  async function submitQuery(): Promise<void> {
    let interval: NodeJS.Timeout;
    const statetext = {
      initial: 'Creating dataset ID...',
      waiting: 'Hang tight. We are still working on it...',
      retry: "Something's taking longer than usual. We are still working on it...",
    };

    function requestUpdate(method: () => Promise<void | DataSetResponse>, retry: boolean = true) {
      processingMessage = retry ? statetext.initial : statetext.retry;
      if (retry) {
        interval = setInterval(() => {
          processingMessage = statetext.waiting;
        }, PROMISE_WAIT_INTERVAL * 1000);
      }
      datasetIdPromise = method()
        .finally(() => clearInterval(interval))
        .catch((err) => {
          if (retry) {
            requestUpdate(method, false);
          } else {
            throw err;
          }
        });
    }

    try {
      query.query.fields = $exports.map((exp) => exp.conceptPath);
      query.query.expectedResultType = activeType || 'DATAFRAME';
      datasetId = '';
      requestUpdate(() =>
        api.post(Picsure.Query, query).then((res: DataSetResponse) => {
          datasetId = res.picsureResultId || 'Error';
        }),
      );
      await datasetIdPromise;
    } catch (error) {
      $stepperState.current--;
      console.error('Error in submitQuery', error);
      throw error;
    }
  }

  $effect(() => {
    saveable = datasetNameInput.length > 2 && datasetId.length > 0;
  });

  onMount(() => {
    preparePromise = submitQuery();
  });
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  {#await preparePromise}
    <Loading ring label="Preparing" />
  {:then}
    <div class="w-full h-full m-2 card p-4">
      <header class="card-header">
        Save the information in your final data export by clicking the Save Dataset ID button.
        Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or manage
        your Dataset IDs.
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
              {#await datasetIdPromise}
                <Loading ring size="micro" label={processingMessage} />
              {:then}
                <div id="dataset-id" class="mr-4">{datasetId}</div>
              {:catch}
                <div>An error occurred while getting the dataset ID. Please try again later.</div>
              {/await}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:catch}
    <div class="flex justify-center mb-4">
      <ErrorAlert
        title="An error occurred while preparing your dataset. Please try again. If this problem persists, please
          contact an administrator."
      />
    </div>
  {/await}
</section>
