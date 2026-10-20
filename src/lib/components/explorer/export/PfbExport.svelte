<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import { Picsure } from '$lib/paths';
  import * as api from '$lib/api';
  import DownloadButton from './DownloadButton.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import { toaster } from '$lib/toaster';
  import { getDatasetId, getQueryRequest } from '$lib/ExportStepperManager.svelte';
  import { log, createLog } from '$lib/logger';
  let exportingIndex: number | null = $state(null);

  async function exportSignedToUrl(index: number, url?: string) {
    if (!url) {
      console.warn('No URL provided for export');
      return;
    }

    exportingIndex = index;

    try {
      const signedUrl = await getSignedUrl();
      if (signedUrl) {
        window.open(url + encodeURIComponent(signedUrl), '_blank');
      } else {
        toaster.error({ title: 'Failed to get signed URL for export.', closable: true });
      }
    } catch (error) {
      console.error('Error during export:', error);
      toaster.error({
        title: api.consentDeniedMessage(error) ?? 'Export failed. Please try again.',
        closable: true,
      });
    } finally {
      exportingIndex = null;
    }
  }

  async function getSignedUrl(): Promise<string | null> {
    const path = `${Picsure.Query}/${getDatasetId()}/signed-url`;
    try {
      const res = await api.get(path);
      return res.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error; // Re-throw to be handled by caller
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
              datasetId: getDatasetId(),
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
  <DownloadButton query={getQueryRequest()} datasetId={getDatasetId()} />
</section>
