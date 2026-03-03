<script lang="ts">
  import { branding } from '$lib/configuration';
  import { Picsure } from '$lib/paths';
  import * as api from '$lib/api';
  import DownloadButton from './DownloadButton.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import { toaster } from '$lib/toaster';
  import { getDatasetId, getQueryRequest } from '$lib/ExportStepperManager.svelte';
  let exportLoading: boolean = $state(false);

  async function exportSignedToUrl(url?: string) {
    if (!url) {
      console.warn('No URL provided for export');
      return;
    }

    exportLoading = true;

    try {
      const signedUrl = await getSignedUrl();
      if (signedUrl) {
        window.open(url + encodeURIComponent(signedUrl), '_blank');
      } else {
        toaster.error({ title: 'Failed to get signed URL for export.', closable: true });
      }
    } catch (error) {
      console.error('Error during export:', error);
      toaster.error({ title: 'Export failed. Please try again.', closable: true });
    } finally {
      exportLoading = false;
    }
  }

  async function getSignedUrl(): Promise<string | null> {
    const path = `${Picsure.QueryV3}/${getDatasetId()}/signed-url`;
    try {
      const res = await api.post(path, getQueryRequest());
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
  {#if branding.explorePage?.pfbExportUrls && branding.explorePage.pfbExportUrls.length > 0}
    {#each branding.explorePage.pfbExportUrls as exportLink}
      <button
        disabled={exportLoading}
        class="flex-initial w-64 btn preset-filled-primary-500 disabled:preset-tonal-primary border border-primary-500"
        onclick={() => exportSignedToUrl(exportLink.url)}
      >
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
        <span>Export to {exportLink.title}</span>
        {#if exportLoading}
          <Loading ring size="micro" label="Exporting" />
        {/if}
      </button>
    {/each}
  {/if}
  <DownloadButton query={getQueryRequest()} datasetId={getDatasetId()} />
</section>
