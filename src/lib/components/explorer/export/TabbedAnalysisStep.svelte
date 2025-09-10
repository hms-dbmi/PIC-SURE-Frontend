<script lang="ts">
  import { branding, features } from '$lib/configuration';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import TabItem from '$lib/components/TabItem.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import DownloadButton from './DownloadButton.svelte';
  import { getDatasetId, getQueryRequest } from '$lib/ExportStepperManager.svelte';

  let tabSet: string = $state('Python');
</script>

<Tabs value={tabSet} onValueChange={(e: { value: string }) => (tabSet = e.value)}>
  {#snippet list()}
    <TabItem bind:group={tabSet} value="Python">Python</TabItem>
    <TabItem bind:group={tabSet} value="R">R</TabItem>
    {#if features.explorer.allowDownload}
      <TabItem bind:group={tabSet} value="Download">Download</TabItem>
    {/if}
  {/snippet}
  {#snippet content()}
    <Tabs.Panel value="Python">
      <CodeBlock
        lang="python"
        code={branding.explorePage.codeBlocks.PythonExport.replace(
          '{{queryId}}',
          getDatasetId() ?? 'DATASET_ID_MISSING',
        ) || 'Code not set for Python in configuration'}
      />
    </Tabs.Panel>
    <Tabs.Panel value="R">
      <CodeBlock
        lang="r"
        code={branding.explorePage.codeBlocks.RExport.replace(
          '{{queryId}}',
          getDatasetId() ?? 'DATASET_ID_MISSING',
        ) || 'Code not set for R in configuration'}
      />
    </Tabs.Panel>
    {#if features.explorer.allowDownload}
      <Tabs.Panel value="Download">
        <DownloadButton query={getQueryRequest()} datasetId={getDatasetId()} />
      </Tabs.Panel>
    {/if}
  {/snippet}
</Tabs>
