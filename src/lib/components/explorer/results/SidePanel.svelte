<script lang="ts">
  import FilterStore from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import ResultsPanel from './ResultsPanel.svelte';
  let { filters } = FilterStore;
  let { exports } = ExportStore;

  export let panelOpen = false;
  function openPanel() {
    panelOpen = true;
  }
  FilterStore.subscribe(() => {
    if ($filters?.length !== 0) {
      openPanel();
    }
  });
  ExportStore.subscribe(() => {
    if ($exports?.length !== 0) {
      openPanel();
    }
  });
</script>

<div class="flex">
  <div id="side-panel-bar">
    <button
      type="button"
      id="results-panel-toggle"
      class="btn-icon btn-icon-sm variant-ringed-primary"
      aria-label="Toggle Results Panel"
      on:click={() => {
        panelOpen = !panelOpen;
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
    justify-content: center;
    width: 42px;
    padding: 0 0.25rem;
  }
</style>
