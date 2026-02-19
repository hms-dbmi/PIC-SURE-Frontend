<script lang="ts">
  import * as api from '$lib/api';
  import { branding, features } from '$lib/configuration';
  import { browser } from '$app/environment';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { Picsure } from '$lib/paths';
  import Modal from '$lib/components/Modal.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { toaster } from '$lib/toaster';
  import Loading from '$lib/components/Loading.svelte';
  import { log, createLog } from '$lib/logger';
  import { isHttpError } from '@sveltejs/kit';
  interface Props {
    query: QueryRequestInterface;
    datasetId: string | undefined;
  }

  let { query, datasetId }: Props = $props();
  let modalOpen: boolean = $state(false);
  let isDownloading: boolean = $state(false);

  const downloadText = $derived(
    query.query.expectedResultType === 'DATAFRAME' ||
      query.query.expectedResultType === 'DATAFRAME_TIMESERIES'
      ? 'Download as CSV'
      : query.query.expectedResultType === 'DATAFRAME_PFB' && features.explorer.enablePfbExport
        ? 'Download as PFB'
        : 'Download is Disabled',
  );

  async function download(): Promise<void> {
    if (!features.explorer.allowDownload) {
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
      log(createLog('DOWNLOAD', 'export.download_clicked', { type: query.query.expectedResultType, datasetId }));
      const startTime = performance.now();
      const res = await api.post(`${Picsure.Query}/${datasetId}/result`, {});
      const duration = Math.round(performance.now() - startTime);
      const blob = new Blob([res], { type: 'octet/stream' });
      
      const responseDataUrl = URL.createObjectURL(blob);
      if (browser) {
        const link = document.createElement('a');
        link.href = responseDataUrl;
        if (query.query.expectedResultType === 'DATAFRAME') {
          link.download = 'pic-sure-data.csv';
        } else if (
          features.explorer.enablePfbExport &&
          query.query.expectedResultType === 'DATAFRAME_PFB'
        ) {
          link.download = 'pic-sure-data.avro';
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      log(createLog('DOWNLOAD', 'export.download_success', { type: query.query.expectedResultType, datasetId }, { bytes: blob.size, duration }));
    } catch (error) {
      console.error('Error in onCompleteHandler', error);
      log(createLog('DOWNLOAD', 'export.download_error', { type: query.query.expectedResultType, datasetId }, { status: isHttpError(error) ? error.status : undefined, error: { message: (error as Error).message } }));
    } finally {
      isDownloading = false;
    }
  }
</script>

<div class="flex items-center m-1">
  {#if features.explorer.allowDownload}
    <Modal
      bind:open={modalOpen}
      title={branding.explorePage.confirmDownloadTitle || 'Are you sure you want to download data?'}
      width="w-1/2"
      withDefault
      confirmText="Download"
      cancelText="Cancel"
      onconfirm={() => download()}
    >
      {branding.explorePage.confirmDownloadMessage ||
        'This action will download the data to your local machine. Are you sure you want to proceed?'}
    </Modal>
    <button
      class="btn preset-filled-primary-500"
      onclick={() => (features.confirmDownload ? (modalOpen = true) : download())}
      ><i class="fa-solid fa-download mr-1"></i>{downloadText}
      {#if isDownloading}
        <Loading ring size="micro" color="white" />
      {/if}
    </button>
  {:else}
    <ErrorAlert title="Download is disabled!" color="warning" solid={true}>
      <p>Downloading data is disabled. Please contact the administrator to enable this feature.</p>
    </ErrorAlert>
  {/if}
</div>
