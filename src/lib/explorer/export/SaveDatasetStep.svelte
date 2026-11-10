<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import Summary from '#lib/explorer/export/Summary.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import TimedLoading, { type TimedMessage } from '#lib/ui/TimedLoading.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import { submitQuery as startQuery } from '#lib/api/picsure/query.ts';
  import { getStepper } from '#lib/ui/stepper/stepper.svelte.ts';
  import { exports } from '#lib/explorer/export/Export.ts';
  import {
    getActiveType,
    getDatasetId,
    setDatasetId,
    getDatasetNameInput,
    setDatasetNameInput,
    setSaveable,
    getQueryRequest,
  } from '#lib/explorer/export/ExportStepperManager.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { cardClass } from '#lib/ui/surface.ts';

  const CREATING_MESSAGES: TimedMessage[] = [
    { afterMs: 0, text: 'Creating dataset ID…' },
    { afterMs: 7000, text: 'Hang tight. We are still working on it…' },
  ];
  const RETRYING_MESSAGES: TimedMessage[] = [
    { afterMs: 0, text: "Something's taking longer than usual. We are still working on it…" },
  ];
  const stepper = getStepper();
  let retrying = $state(false);
  let datasetIdPromise: Promise<void> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());
  let datasetNameInput: string | undefined = $state(getDatasetNameInput());

  async function submitQuery(): Promise<void> {
    function requestUpdate(method: () => Promise<void>, canRetry = true) {
      retrying = !canRetry;
      datasetIdPromise = method().catch((err) => {
        if (canRetry) {
          requestUpdate(method, false);
        } else {
          throw err;
        }
      });
    }

    try {
      getQueryRequest().query.expectedResultType = getActiveType() || 'DATAFRAME';
      setDatasetId('');
      requestUpdate(() => {
        // Make a copy so we don't add exports to selected for the loaded query
        const request = structuredClone($state.snapshot(getQueryRequest()));
        request.query.select = [
          ...config.settings.exportSystemFields,
          ...request.query.select,
          ...$exports.map(({ conceptPath }) => conceptPath),
        ];
        return startQuery(request).then((res) => {
          setDatasetId(res.picsureResultId || 'Error');
          if (res.picsureResultId) {
            log(
              createLog('DATA', 'dataset.create', {
                name: getDatasetNameInput(),
                datasetId: res.picsureResultId,
              }),
            );
          }
        });
      });
    } catch (error) {
      stepper.state.current--;
      console.error('Error in submitQuery', error);
      throw error;
    }
  }

  $effect(() => {
    setSaveable((getDatasetNameInput()?.length ?? 0) > 2 && (getDatasetId()?.length ?? 0) > 0);
  });

  $effect(() => {
    setDatasetNameInput(datasetNameInput);
  });

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
              bind:value={datasetNameInput}
              required
            />
          </div>
          <div class="flex items-center m-2">
            <div class="flex items-center">
              {#await datasetIdPromise}
                <label for="export-dataset-id" class="font-bold mr-2">Dataset ID:</label>
                <TimedLoading
                  size="micro"
                  messages={retrying ? RETRYING_MESSAGES : CREATING_MESSAGES}
                />
              {:then}
                <label for="export-dataset-id" class="font-bold mr-2">Dataset ID:</label>
                <div id="export-dataset-id" class="mr-4">{getDatasetId()}</div>
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
