<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import TabItem from '$lib/components/TabItem.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import DownloadButton from './DownloadButton.svelte';
  import { getDatasetId, getQueryRequest } from '$lib/ExportStepperManager.svelte';
  import { log, createLog } from '$lib/logger';

  let tabSet: string = $state(
    config.features.analyzeApi
      ? 'Python'
      : config.features.explorer.allowDownload
        ? 'Download'
        : '',
  );
</script>

{#if config.branding.explorePage.analysisExportText && config.branding.explorePage.analysisExportText.length > 0}
  <p class="mt-4">{config.branding.explorePage.analysisExportText}</p>
{/if}
<Tabs
  value={tabSet}
  onValueChange={(e: { value: string }) => {
    tabSet = e.value;
    log(createLog('EXPORT', 'export.tab_change', { tab: e.value }));
  }}
>
  {#snippet list()}
    {#if config.features.analyzeApi}
      <TabItem bind:group={tabSet} value="Python">Python</TabItem>
      <TabItem bind:group={tabSet} value="R">R</TabItem>
    {/if}
    {#if config.features.explorer.allowDownload}
      <TabItem bind:group={tabSet} value="Download">Download</TabItem>
    {/if}
  {/snippet}
  {#snippet content()}
    <Tabs.Panel value="Python">
      <CodeBlock
        lang="python"
        code={config.branding.explorePage.codeBlocks.PythonExport.replace(
          '{{queryId}}',
          getDatasetId() ?? 'DATASET_ID_MISSING',
        ) || 'Code not set for Python in configuration'}
      />
    </Tabs.Panel>
    <Tabs.Panel value="R">
      <CodeBlock
        lang="r"
        code={config.branding.explorePage.codeBlocks.RExport.replace(
          '{{queryId}}',
          getDatasetId() ?? 'DATASET_ID_MISSING',
        ) || 'Code not set for R in configuration'}
      />
    </Tabs.Panel>
    {#if config.features.explorer.allowDownload}
      <Tabs.Panel value="Download">
        <div class="flex justify-center w-full">
          <DownloadButton query={getQueryRequest()} datasetId={getDatasetId()} />
        </div>
      </Tabs.Panel>
    {/if}
  {/snippet}
</Tabs>
{#if config.branding.explorePage.goTo.instructions && config.branding.explorePage.goTo.instructions.length > 0}
  <p>{config.branding.explorePage.goTo.instructions}</p>
{/if}
