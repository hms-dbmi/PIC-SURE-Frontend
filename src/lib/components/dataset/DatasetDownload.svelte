<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as api from '$lib/api';
  import { config } from '$lib/configuration.svelte';
  import { log, createLog } from '$lib/logger';
  import type { DataSet } from '$lib/models/Dataset';
  import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
  import { QueryV3 } from '$lib/models/query/Query';
  import { exportResultType, requestVariant } from '$lib/services/datasets';
  import {
    EXPORT_PREPARE_FAILED_MESSAGE,
    SAMPLE_DISABLED_MESSAGE,
    isSessionEnded,
    statusWaitFailureMessage,
    waitUntilAvailable,
  } from '$lib/services/exportStatus';
  import { toaster } from '$lib/toaster';
  import Loading from '$lib/components/Loading.svelte';
  import DownloadButton from '$lib/components/explorer/export/DownloadButton.svelte';
  import PfbExport from '$lib/components/explorer/export/PfbExport.svelte';

  interface Props {
    /** The named dataset whose full and sample exports are offered. */
    dataset: DataSet;
  }

  interface Variant {
    sample: boolean;
    label: string;
  }

  let { dataset }: Props = $props();

  let preparing: Variant | undefined = $state(undefined);
  let ready: { queryId: string; sample: boolean } | undefined = $state(undefined);

  const unmounted = new AbortController();
  onDestroy(() => unmounted.abort());

  const resultType = $derived(exportResultType(dataset));
  const isPfb = $derived(resultType === 'DATAFRAME_PFB');
  const offered = $derived(
    resultType !== undefined &&
      !dataset.federated &&
      (isPfb ? config.features.explorer.enablePfbExport : config.features.explorer.allowDownload),
  );
  const variants: Variant[] = $derived([
    { sample: false, label: 'Full dataset' },
    ...(config.features.explorer.enableSampleDataset
      ? [{ sample: true, label: 'Sample dataset' }]
      : []),
  ]);

  /**
   * Builds the query handed to the export controls, which read its result type and log its
   * `sample` flag. The controls fetch by query id and never send this query.
   *
   * @param sample True when the prepared variant is the sample.
   * @returns The stored query marked with the variant that was prepared.
   */
  function variantQuery(sample: boolean): QueryRequestInterfaceV3 {
    return { query: new QueryV3({ ...(dataset.query as QueryV3), sample }) };
  }

  /**
   * Picks the one message shown for a failed request.
   *
   * @param error The value the request or the status wait rejected with.
   * @param waiting True when the failure came from the status wait, false when it came from
   * submitting the query.
   * @returns The consent, sample or export message that matches the failure.
   */
  function failureMessage(error: unknown, waiting: boolean): string {
    if (waiting) {
      return statusWaitFailureMessage(error);
    }
    const consentMessage = api.consentDeniedMessage(error);
    if (consentMessage) {
      return consentMessage;
    }
    return api.isSampleDisabled(error) ? SAMPLE_DISABLED_MESSAGE : EXPORT_PREPARE_FAILED_MESSAGE;
  }

  /**
   * Gets the query for a variant, waits for its result, then shows the export controls for it.
   *
   * @param variant The variant the user asked for.
   */
  async function prepare(variant: Variant): Promise<void> {
    if (preparing) {
      return;
    }
    preparing = variant;
    ready = undefined;
    let waiting = false;
    try {
      log(
        createLog('DATASET', 'dataset.variant_requested', {
          datasetId: dataset.queryId,
          sample: variant.sample,
          type: resultType,
        }),
      );
      const queryId = await requestVariant(dataset, variant.sample, unmounted.signal);
      if (unmounted.signal.aborted) {
        return;
      }
      waiting = true;
      await waitUntilAvailable(queryId, unmounted.signal);
      if (unmounted.signal.aborted) {
        return;
      }
      ready = { queryId, sample: variant.sample };
    } catch (error) {
      if (unmounted.signal.aborted || isSessionEnded(error)) {
        return;
      }
      console.error('Error preparing dataset export', error);
      toaster.error({ title: failureMessage(error, waiting), closable: true });
    } finally {
      preparing = undefined;
    }
  }
</script>

{#if offered}
  <section data-testid="dataset-download" class="my-4">
    <h2 class="text-left h4 mb-2 mt-6">Export Dataset</h2>
    <div class="flex gap-2">
      {#each variants as variant (variant.sample)}
        {@const busy = preparing?.sample === variant.sample}
        <button
          type="button"
          data-testid="dataset-download-{variant.sample ? 'sample' : 'full'}"
          class="btn preset-filled-primary-500"
          disabled={preparing !== undefined}
          aria-busy={busy || undefined}
          onclick={() => prepare(variant)}
        >
          {variant.label}
          {#if busy}
            <Loading ring size="micro" color="white" />
          {/if}
        </button>
      {/each}
    </div>
    {#if ready}
      <div data-testid="dataset-download-ready" class="flex flex-col items-start mt-4">
        <p>Your {ready.sample ? 'sample' : 'full'} dataset is ready.</p>
        {#key ready.queryId}
          {@const query = variantQuery(ready.sample)}
          {#if isPfb}
            <PfbExport {query} datasetId={ready.queryId} />
          {:else}
            <DownloadButton {query} datasetId={ready.queryId} />
          {/if}
        {/key}
      </div>
    {/if}
  </section>
{/if}
