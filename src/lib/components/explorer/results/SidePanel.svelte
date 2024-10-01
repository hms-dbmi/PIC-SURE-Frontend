<script lang="ts">
  import ExportStore from '$lib/stores/Export';
  import ResultsPanel from '$lib/components/explorer/results/ResultsPanel.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { type Unsubscriber } from 'svelte/store';
  import {
    filters,
    hasGenomicFilter,
    hasInvalidFilter,
    hasUnallowedFilter,
  } from '$lib/stores/Filter';
  import { page } from '$app/stores';
  import { panelOpen } from '$lib/stores/SidePanel';
  let { exports } = ExportStore;

  let unsubFilterStore: Unsubscriber;
  let unsubExportStore: Unsubscriber;


  function openPanel() {
    panelOpen.set(true);
  }

  onMount(() => {
    unsubFilterStore = filters.subscribe(() => {
      if ($filters?.length !== 0) {
        openPanel();
      }
    });
    unsubExportStore = ExportStore.subscribe(() => {
      if ($exports?.length !== 0) {
        openPanel();
      }
    });
  });

  onDestroy(() => {
    unsubFilterStore && unsubFilterStore();
    unsubExportStore && unsubExportStore();
  });

  $: isDiscoverPage = $page && $page.url.pathname.includes('/discover');

  $: shouldDisablePanel =
    (!isDiscoverPage && $hasInvalidFilter) ||
    (isDiscoverPage && ($hasGenomicFilter || $hasUnallowedFilter));
  console.log('shouldDisablePanel', shouldDisablePanel);
  console.log('panelOpen', $panelOpen);
  console.log('isDiscoverPage', isDiscoverPage);
  console.log('hasInvalidFilter', $hasInvalidFilter);
  console.log('hasGenomicFilter', $hasGenomicFilter);
  console.log('hasUnallowedFilter', $hasUnallowedFilter);
</script>

<div id="side-panel" class="flex {panelOpen ? 'open-panel' : 'closed-panel'}">
  <div id="side-panel-bar">
    <button
      type="button"
      id="results-panel-toggle"
      title="{panelOpen ? 'Hide' : 'Show'} Results"
      class="btn-icon btn-icon-sm variant-ghost-primary hover:variant-filled-primary"
      aria-label="Toggle Results Panel"
      disabled={shouldDisablePanel}
      on:click={() => {
        panelOpen.update(value => !value);
      }}
    >
      <i class="fa-solid {panelOpen ? 'fa-arrow-right' : 'fa-arrow-left'}"></i>
    </button>
  </div>
  {#if panelOpen}
    <ResultsPanel on:openPanel={openPanel} />
  {/if}
</div>

<style>
  #side-panel-bar {
    display: flex;
    flex-direction: column;
    justify-content: top;
    width: 42px;
    padding: 0 0.25rem;
  }
  #side-panel-bar #results-panel-toggle {
    margin-top: 2.3rem;
  }
</style>
