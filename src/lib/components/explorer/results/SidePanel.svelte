<script lang="ts">
  import ResultsPanel from './ResultsPanel.svelte';
  export let panelOpen = false;
</script>

<div class="flex">
  <div id="side-panel-bar">
    <button
      type="button"
      id="results-panel-toggle"
      class="btn-icon btn-icon-sm variant-ringed-primary"
      on:click={() => {
        panelOpen = !panelOpen;
      }}
    >
      <i class="fa-solid {panelOpen ? 'fa-arrow-right' : 'fa-arrow-left'}"></i>
    </button>
  </div>
  {#if panelOpen}
    <ResultsPanel />
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
