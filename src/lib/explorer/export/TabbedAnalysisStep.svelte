<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import Tabs, { type Tab } from '#lib/ui/Tabs.svelte';
  import CodeBlock from '#lib/ui/CodeBlock.svelte';
  import DownloadButton from './DownloadButton.svelte';
  import {
    getDatasetId,
    getQueryRequest,
  } from '#lib/explorer/export/ExportStepperManager.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  type AnalysisTab = 'Python' | 'R' | 'Download';

  const tabs: Tab<AnalysisTab>[] = $derived([
    ...(config.features.analyzeApi
      ? [
          { value: 'Python' as const, label: 'Python' },
          { value: 'R' as const, label: 'R' },
        ]
      : []),
    ...(config.features.explorer.allowDownload
      ? [{ value: 'Download' as const, label: 'Download' }]
      : []),
  ]);
  let tabSet: AnalysisTab | undefined = $derived(tabs[0]?.value);
</script>

{#if config.branding.explorePage.analysisExportText && config.branding.explorePage.analysisExportText.length > 0}
  <p class="mt-4">{config.branding.explorePage.analysisExportText}</p>
{/if}
{#if tabSet}
  <Tabs
    label="Analysis options"
    {tabs}
    value={tabSet}
    onchange={(tab) => {
      tabSet = tab;
      log(createLog('EXPORT', 'export.tab_change', { tab }));
    }}
  >
    {#snippet panel(tab)}
      {#if tab === 'Python'}
        <CodeBlock
          lang="python"
          code={config.branding.explorePage.codeBlocks.PythonExport.replace(
            '{{queryId}}',
            getDatasetId() ?? 'DATASET_ID_MISSING',
          ) || 'Code not set for Python in configuration'}
        />
      {:else if tab === 'R'}
        <CodeBlock
          lang="r"
          code={config.branding.explorePage.codeBlocks.RExport.replace(
            '{{queryId}}',
            getDatasetId() ?? 'DATASET_ID_MISSING',
          ) || 'Code not set for R in configuration'}
        />
      {:else}
        <div class="flex justify-center w-full">
          <DownloadButton query={getQueryRequest()} datasetId={getDatasetId()} />
        </div>
      {/if}
    {/snippet}
  </Tabs>
{/if}
{#if config.branding.explorePage.goTo.instructions && config.branding.explorePage.goTo.instructions.length > 0}
  <p>{config.branding.explorePage.goTo.instructions}</p>
{/if}
