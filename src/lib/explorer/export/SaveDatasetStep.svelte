<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import Summary from '#lib/explorer/export/Summary.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import { submitQuery as startQuery } from '#lib/api/picsure/query.ts';
  import { getStepper } from '#lib/ui/stepper/stepper.svelte.ts';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { cardClass } from '#lib/ui/surface.ts';

  const PROMISE_WAIT_INTERVAL = 7;
  const stepper = getStepper();
  let processingMessage: string = $state('');
  let datasetIdPromise: Promise<void> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());

  async function submitQuery(): Promise<void> {
    let interval: NodeJS.Timeout;
    const statetext = {
      initial: 'Creating dataset ID...',
      waiting: 'Hang tight. We are still working on it...',
      retry: "Something's taking longer than usual. We are still working on it...",
    };

    function requestUpdate(method: () => Promise<void>, retry: boolean = true) {
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
      exportState.useChosenResultType();
      exportState.setDatasetId('');
      requestUpdate(() => {
        // Make a copy so we don't add exports to selected for the loaded query
        const request = structuredClone(exportState.request);
        request.query.select = [
          ...config.settings.exportSystemFields,
          ...request.query.select,
          ...exportState.variables.map(({ conceptPath }) => conceptPath),
        ];
        return startQuery(request).then((res) => {
          exportState.setDatasetId(res.picsureResultId || 'Error');
          if (res.picsureResultId) {
            log(
              createLog('DATA', 'dataset.create', {
                name: exportState.datasetName,
                datasetId: res.picsureResultId,
              }),
            );
          }
        });
      });
      await datasetIdPromise;
    } catch (error) {
      stepper.state.current--;
      console.error('Error in submitQuery', error);
      throw error;
    }
  }

  onMount(() => {
    preparePromise = submitQuery();
  });
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  {#await preparePromise}
    <Loading ring />
  {:then}
    <div class="w-full h-full m-2 {cardClass} p-4">
      <header class="card-header">
        Save the information in your final data export by clicking the Save Dataset ID button.
        Navigate to the <a class="anchor" href={resolve('dataset')}>Manage Datasets page</a> to view or
        manage your Dataset IDs.
      </header>
      <hr />
      <div class="card-body p-4 flex flex-col justify-center items-center">
        <div>
          <div class="flex items-center m-2">
            <label for="export-dataset-name" class="font-bold mr-2">Dataset Name:</label>
            <input
              type="text"
              id="export-dataset-name"
              class="input w-80"
              placeholder="Enter a name"
              bind:value={
                () => exportState.datasetName ?? '', (name) => exportState.setDatasetName(name)
              }
              required
            />
          </div>
          <div class="flex items-center m-2">
            <div class="flex items-center">
              {#await datasetIdPromise}
                <label for="export-dataset-id" class="font-bold mr-2">Dataset ID:</label>
                <Loading ring size="micro" label={processingMessage} />
              {:then}
                <label for="export-dataset-id" class="font-bold mr-2">Dataset ID:</label>
                <div id="export-dataset-id" class="mr-4">{exportState.datasetId}</div>
              {:catch}
                <ErrorAlert
                  title="An error occurred while getting the dataset ID. Please try again later."
                />
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
