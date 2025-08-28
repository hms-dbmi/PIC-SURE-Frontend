<script lang="ts">
  import * as api from '$lib/api';
  import { branding, features } from '$lib/configuration';
  import { browser } from '$app/environment';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { Picsure } from '$lib/paths';
  import Modal from '$lib/components/Modal.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  interface Props {
    query: QueryRequestInterface;
    datasetId: string;
  }

  let { query, datasetId }: Props = $props();
  let modalOpen: boolean = $state(false);

  const downloadText = $derived(
    query.query.expectedResultType === 'DATAFRAME'
      ? 'Download as CSV'
      : query.query.expectedResultType === 'DATAFRAME_PFB' && features.explorer.enablePfbExport
        ? 'Download as PFB'
        : 'Download is Disabled',
  );

  async function download(): Promise<void> {
    if (!features.explorer.allowDownload) {
      return;
    }
    try {
      const res = await api.post(`${Picsure.Query}/${datasetId}/result`, {});
      const responseDataUrl = URL.createObjectURL(new Blob([res], { type: 'octet/stream' }));
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
    } catch (error) {
      console.error('Error in onCompleteHandler', error);
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
      ><i class="fa-solid fa-download mr-1"></i>{downloadText}</button
    >
  {:else}
    <ErrorAlert title="Download is disabled!" color="warning" solid={true}>
      <p>Downloading data is disabled. Please contact the administrator to enable this feature.</p>
    </ErrorAlert>
  {/if}
</div>
