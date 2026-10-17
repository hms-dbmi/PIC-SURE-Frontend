<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { ApiError, consentDeniedMessage } from '#lib/api/errors.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { browser } from '$app/env';
  import type { QueryRequestInterfaceV3 } from '#lib/api/picsure/query.types.ts';
  import { getQueryResult } from '#lib/api/picsure/query.ts';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import { toaster } from '#lib/ui/toaster.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  interface Props {
    query: QueryRequestInterfaceV3;
    datasetId: string | undefined;
  }

  let { query, datasetId }: Props = $props();
  let modalOpen: boolean = $state(false);
  let isDownloading: boolean = $state(false);

  const downloadText = $derived(
    query.query.expectedResultType === 'DATAFRAME' ||
      query.query.expectedResultType === 'DATAFRAME_TIMESERIES'
      ? 'Download as CSV'
      : query.query.expectedResultType === 'DATAFRAME_PFB' &&
          config.features.explorer.enablePfbExport
        ? 'Download as PFB'
        : 'Download is Disabled',
  );

  async function download(): Promise<void> {
    if (!config.features.explorer.allowDownload) {
      return;
    }
    if (!datasetId) {
      console.error('No dataset ID provided');
      toaster.error({
        title: 'No dataset ID provided. Go back and save a dataset and try again.',
        closable: true,
      });
      return;
    }
    try {
      isDownloading = true;
      log(
        createLog('DOWNLOAD', 'export.download_clicked', {
          type: query.query.expectedResultType,
          datasetId,
        }),
      );
      const startTime = performance.now();
      const res = await getQueryResult(datasetId);
      const duration = Math.round(performance.now() - startTime);
      const blob = new Blob([res], { type: 'octet/stream' });

      const responseDataUrl = URL.createObjectURL(blob);
      if (browser) {
        const link = document.createElement('a');
        link.href = responseDataUrl;
        if (
          query.query.expectedResultType === 'DATAFRAME' ||
          query.query.expectedResultType === 'DATAFRAME_TIMESERIES'
        ) {
          link.download = 'pic-sure-data.csv';
        } else if (
          config.features.explorer.enablePfbExport &&
          query.query.expectedResultType === 'DATAFRAME_PFB'
        ) {
          link.download = 'pic-sure-data.avro';
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      log(
        createLog(
          'DOWNLOAD',
          'export.download_success',
          { type: query.query.expectedResultType, datasetId },
          { status: 200, bytes: blob.size, duration },
        ),
      );
    } catch (error) {
      console.error('Error in onCompleteHandler', error);
      const consentMessage = consentDeniedMessage(error);
      if (consentMessage) {
        toaster.error({ title: consentMessage, closable: true });
      }
      log(
        createLog(
          'DOWNLOAD',
          'export.download_error',
          { type: query.query.expectedResultType, datasetId },
          {
            status: error instanceof ApiError ? error.status : undefined,
            error: { message: (error as Error).message },
          },
        ),
      );
    } finally {
      isDownloading = false;
    }
  }
</script>

<div class="flex items-center m-1">
  {#if config.features.explorer.allowDownload}
    <ConfirmDialog
      bind:open={modalOpen}
      title={config.branding.explorePage.confirmDownloadTitle ||
        'Are you sure you want to download data?'}
      size="half"
      confirmLabel="Download"
      onconfirm={() => download()}
    >
      {config.branding.explorePage.confirmDownloadMessage ||
        'This action will download the data to your local machine. Are you sure you want to proceed?'}
    </ConfirmDialog>
    <Button onclick={() => (config.features.confirmDownload ? (modalOpen = true) : download())}
      ><i class="fa-solid fa-download mr-1"></i>{downloadText}
      {#if isDownloading}
        <Loading ring size="micro" color="white" />
      {/if}
    </Button>
  {:else}
    <ErrorAlert title="Download is disabled!" color="warning" solid={true}>
      <p>Downloading data is disabled. Please contact the administrator to enable this feature.</p>
    </ErrorAlert>
  {/if}
</div>
