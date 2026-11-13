<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as api from '$lib/api';
  import { config } from '$lib/configuration.svelte';
  import { log, createLog } from '$lib/logger';
  import type { DataSet } from '$lib/models/Dataset';
  import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
  import { QueryV3 } from '$lib/models/query/Query';
  import {
    exportResultType,
    offeredExportTypes,
    requestVariant,
    type ExportResultType,
  } from '$lib/services/datasets';
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

  interface ReadyExport {
    queryId: string;
    sample: boolean;
    resultType: ExportResultType;
  }

  const TYPE_LABELS: Record<ExportResultType, string> = {
    DATAFRAME: 'Data frame (CSV)',
    DATAFRAME_TIMESERIES: 'Timeseries (CSV)',
    DATAFRAME_PFB: 'PFB',
  };

  let { dataset }: Props = $props();

  let preparing: Variant | undefined = $state(undefined);
  let ready: ReadyExport | undefined = $state(undefined);
  let chosenType: ExportResultType | undefined = $state(undefined);

  const unmounted = new AbortController();
  onDestroy(() => unmounted.abort());

  const resultType = $derived(exportResultType(dataset));
  const isPfb = $derived(resultType === 'DATAFRAME_PFB');
  const types = $derived(offeredExportTypes(dataset, config.features.explorer));
  const selectedType = $derived(
    chosenType !== undefined && types.includes(chosenType) ? chosenType : resultType,
  );
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
   * @param prepared The variant that was prepared.
   * @returns The stored query marked with the variant that was prepared.
   */
  function variantQuery(prepared: ReadyExport): QueryRequestInterfaceV3 {
    return {
      query: new QueryV3({
        ...(dataset.query as QueryV3),
        sample: prepared.sample,
        expectedResultType: prepared.resultType,
      }),
    };
  }

  /**
   * Switches the export type the two actions act on and drops the export prepared for the
   * previous type. While an export is being prepared the choice is refused and the control is
   * put back on the type in use.
   *
   * @param control The type control, read for the chosen option.
   */
  function chooseType(control: HTMLSelectElement): void {
    const type = types.find((candidate) => candidate === control.value);
    if (preparing || type === undefined) {
      control.value = selectedType ?? '';
      return;
    }
    if (type !== selectedType) {
      chosenType = type;
      ready = undefined;
    }
  }

  /**
   * Picks the one message shown for a failed request.
   *
   * @param error The value the request or the status wait rejected with.
   * @param waiting True when the failure came from the status wait, false when it came from
   * submitting the query.
   * @returns The consent, sample or export message that matches the failure. A refused submit
   * shows the server's own message when it gave one.
   */
  function failureMessage(error: unknown, waiting: boolean): string {
    if (waiting) {
      return statusWaitFailureMessage(error);
    }
    const consentMessage = api.consentDeniedMessage(error);
    if (consentMessage) {
      return consentMessage;
    }
    if (api.isSampleDisabled(error)) {
      return SAMPLE_DISABLED_MESSAGE;
    }
    return api.serverErrorMessage(error) ?? EXPORT_PREPARE_FAILED_MESSAGE;
  }

  /**
   * Gets the query for a variant of the selected export type, waits for its result, then shows
   * the export controls for it. The type is read once, when the request starts, so the finished
   * export is always the type that was asked for.
   *
   * @param variant The variant the user asked for.
   */
  async function prepare(variant: Variant): Promise<void> {
    const type = selectedType;
    if (preparing || type === undefined) {
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
          type,
        }),
      );
      const queryId = await requestVariant(dataset, variant.sample, type, unmounted.signal);
      if (unmounted.signal.aborted) {
        return;
      }
      waiting = true;
      await waitUntilAvailable(queryId, unmounted.signal);
      if (unmounted.signal.aborted) {
        return;
      }
      ready = { queryId, sample: variant.sample, resultType: type };
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
    <div class="flex items-end gap-2">
      <label class="grid gap-1">
        <span class="font-bold">Export type</span>
        <select
          class="select"
          data-testid="dataset-download-type"
          value={selectedType}
          disabled={preparing !== undefined}
          onchange={(event) => chooseType(event.currentTarget)}
        >
          {#each types as type (type)}
            <option value={type}>{TYPE_LABELS[type]}</option>
          {/each}
        </select>
      </label>
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
          {@const query = variantQuery(ready)}
          {#if ready.resultType === 'DATAFRAME_PFB'}
            <PfbExport {query} datasetId={ready.queryId} />
          {:else}
            <DownloadButton {query} datasetId={ready.queryId} />
          {/if}
        {/key}
      </div>
    {/if}
  </section>
{/if}
