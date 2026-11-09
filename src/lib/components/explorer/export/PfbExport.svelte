<script lang="ts">
  import { onDestroy } from 'svelte';
  import { config } from '$lib/configuration.svelte';
  import { Picsure } from '$lib/paths';
  import * as api from '$lib/api';
  import { fetchWhenReady, trackNotReady } from '$lib/services/exportStatus';
  import DownloadButton from './DownloadButton.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import { toaster } from '$lib/toaster';
  import { getDatasetId, getQueryRequest } from '$lib/ExportStepperManager.svelte';
  import { log, createLog } from '$lib/logger';
  import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';

  interface Props {
    /** The exported query. Defaults to the one the export stepper holds. */
    query?: QueryRequestInterfaceV3;
    /** The id of the query whose result is exported. Defaults to the export stepper's. */
    datasetId?: string;
  }

  let { query, datasetId }: Props = $props();
  const exportQuery = $derived(query ?? getQueryRequest());
  const exportId = $derived(datasetId ?? getDatasetId());
  let exportingIndex: number | null = $state(null);

  const READY_AFTER_WAIT_MESSAGE =
    'Your export is ready. Click the export button again to open it.';

  const unmounted = new AbortController();
  onDestroy(() => unmounted.abort());

  async function exportSignedToUrl(index: number, url?: string) {
    if (!url) {
      console.warn('No URL provided for export');
      return;
    }

    exportingIndex = index;

    const queryId = exportId;
    const path = `${Picsure.Query}/${queryId}/signed-url`;
    const signedUrlRequest = trackNotReady(() => api.get(path));

    try {
      const res = await fetchWhenReady(queryId, signedUrlRequest.fetch, unmounted.signal);
      if (unmounted.signal.aborted) {
        return;
      }
      const signedUrl: string | null = res.signedUrl || null;
      if (!signedUrl) {
        toaster.error({ title: 'Failed to get signed URL for export.', closable: true });
        return;
      }
      const opened = window.open(url + encodeURIComponent(signedUrl), '_blank');
      if (!opened && signedUrlRequest.waited()) {
        toaster.info({ title: READY_AFTER_WAIT_MESSAGE, closable: true });
      }
    } catch (error) {
      if (unmounted.signal.aborted) {
        return;
      }
      console.error('Error during export:', error);
      toaster.error({
        title:
          api.consentDeniedMessage(error) ??
          signedUrlRequest.failureMessage(error) ??
          'Export failed. Please try again.',
        closable: true,
      });
    } finally {
      exportingIndex = null;
    }
  }
</script>

<section class="flex flex-col gap-8 place-items-center">
  <div class="flex justify-center mt-4">
    Select an option below to export your selected data in PFB format.
  </div>
  {#if config.branding.explorePage?.pfbExportUrls && config.branding.explorePage.pfbExportUrls.length > 0}
    {#each config.branding.explorePage.pfbExportUrls as exportLink, index}
      {@const exporting = exportingIndex === index}
      <button
        disabled={exportingIndex !== null}
        aria-busy={exporting || undefined}
        aria-label={exporting ? `Exporting to ${exportLink.title}` : undefined}
        class="flex-initial w-64 btn preset-filled-primary-500 border border-primary-500 {exporting
          ? 'disabled:opacity-100'
          : 'disabled:preset-tonal-primary'}"
        onclick={() => {
          log(
            createLog('EXPORT', 'export.pfb_signed_url', {
              platform: exportLink.title,
              datasetId: exportId,
            }),
          );
          exportSignedToUrl(index, exportLink.url);
        }}
      >
        {#if exporting}
          <Loading ring size="micro" color="white" label="Exporting…" />
        {:else}
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span>Export to {exportLink.title}</span>
        {/if}
      </button>
    {/each}
  {/if}
  <DownloadButton query={exportQuery} datasetId={exportId} />
</section>
