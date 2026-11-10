<script lang="ts">
  import { exports } from '#lib/explorer/export/Export.ts';
  import ResultsPanel from '#lib/explorer/components/results/ResultsPanel.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { type Unsubscriber } from 'svelte/store';
  import { filters } from '#lib/query/filters.ts';
  import { panelOpen } from '#lib/explorer/panel.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import Button from '#lib/ui/Button.svelte';

  let unsubFilterStore: Unsubscriber;
  let unsubExportStore: Unsubscriber;

  function openPanel() {
    panelOpen.set(true);
  }

  onMount(() => {
    unsubFilterStore = filters.subscribe((filterList) => {
      if (filterList?.length !== 0) {
        openPanel();
      }
    });
    unsubExportStore = exports.subscribe((exportList) => {
      if (exportList?.length !== 0) {
        openPanel();
      }
    });
  });

  onDestroy(() => {
    unsubFilterStore && unsubFilterStore();
    unsubExportStore && unsubExportStore();
  });
</script>

<div id="results-side-panel" class="flex {$panelOpen ? 'open' : 'closed'}-panel">
  <div id="results-side-panel-bar">
    <Button
      id="results-panel-toggle"
      title="{$panelOpen ? 'Hide' : 'Show'} Results"
      variant="tonal"
      size="icon-sm"
      class="mt-[2.3rem]"
      aria-label="Toggle Results Panel"
      onclick={() => {
        panelOpen.update((value) => {
          log(createLog('ACTION', 'results_panel.toggle', { open: !value }));
          return !value;
        });
      }}
    >
      <i class="fa-solid {$panelOpen ? 'fa-arrow-right' : 'fa-arrow-left'}"></i>
    </Button>
  </div>
  {#if $panelOpen}
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
