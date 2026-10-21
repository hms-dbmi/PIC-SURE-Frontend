<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import { getSignedUrl } from '#lib/api/picsure/query.ts';
  import { consentDeniedMessage } from '#lib/api/errors.ts';
  import DownloadButton from './DownloadButton.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import { toaster } from '#lib/ui/toaster.ts';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import Button from '#lib/ui/Button.svelte';
  let exportLoading: boolean = $state(false);

  async function exportSignedToUrl(url?: string) {
    if (!url) {
      console.warn('No URL provided for export');
      return;
    }

    exportLoading = true;

    try {
      const signedUrl = await getSignedUrl(exportState.datasetId ?? '');
      if (signedUrl) {
        window.open(url + encodeURIComponent(signedUrl), '_blank');
      } else {
        toaster.error({ title: 'Failed to get signed URL for export.', closable: true });
      }
    } catch (error) {
      console.error('Error during export:', error);
      toaster.error({
        title: consentDeniedMessage(error) ?? 'Export failed. Please try again.',
        closable: true,
      });
    } finally {
      exportLoading = false;
    }
  }
</script>

<section class="flex flex-col gap-8 place-items-center">
  <div class="flex justify-center mt-4">
    Select an option below to export your selected data in PFB format.
  </div>
  {#if config.branding.explorePage?.pfbExportUrls && config.branding.explorePage.pfbExportUrls.length > 0}
    {#each config.branding.explorePage.pfbExportUrls as exportLink}
      <Button
        disabled={exportLoading}
        variant="filled-bordered"
        class="flex-initial w-64"
        onclick={() => {
          log(
            createLog('EXPORT', 'export.pfb_signed_url', {
              platform: exportLink.title,
              datasetId: exportState.datasetId,
            }),
          );
          exportSignedToUrl(exportLink.url);
        }}
      >
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
        <span>Export to {exportLink.title}</span>
        {#if exportLoading}
          <Loading ring size="micro" label="Exporting" />
        {/if}
      </Button>
    {/each}
  {/if}
  <DownloadButton query={exportState.request} datasetId={exportState.datasetId} />
</section>
