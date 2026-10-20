<script lang="ts">
  import { onMount } from 'svelte';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import ResultsPanel from '#lib/explorer/components/results/ResultsPanel.svelte';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import Button from '#lib/ui/Button.svelte';

  onMount(() => {
    if (filterState.phenotypic.length !== 0 || exportState.variables.length !== 0) {
      explorerPanel.show();
    }
  });

  function toggle() {
    const open = explorerPanel.toggle();
    log(createLog('ACTION', 'results_panel.toggle', { open }));
  }
</script>

<div id="results-side-panel" class="flex {explorerPanel.open ? 'open' : 'closed'}-panel">
  <div id="results-side-panel-bar">
    <Button
      id="results-panel-toggle"
      title="{explorerPanel.open ? 'Hide' : 'Show'} Results"
      variant="tonal"
      size="icon-sm"
      class="mt-[2.3rem]"
      aria-label="Toggle Results Panel"
      onclick={toggle}
    >
      <i class="fa-solid {explorerPanel.open ? 'fa-arrow-right' : 'fa-arrow-left'}"></i>
    </Button>
  </div>
  {#if explorerPanel.open}
    <ResultsPanel />
  {/if}
</div>

<style>
  #results-side-panel-bar {
    display: flex;
    flex-direction: column;
    justify-content: top;
    width: 42px;
    padding: 0 0.25rem;
  }
</style>
