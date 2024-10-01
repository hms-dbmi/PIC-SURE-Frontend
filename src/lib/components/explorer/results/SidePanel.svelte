<script lang="ts">
  import ExportStore from '$lib/stores/Export';
  import ResultsPanel from '$lib/components/explorer/results/ResultsPanel.svelte';
  import { onDestroy, onMount } from 'svelte';
  import {get, type Readable, type Unsubscriber} from 'svelte/store';
  import {filters, hasGenomicFilter, hasInvalidFilter, hasUnallowedFilter} from '$lib/stores/Filter';
  import {user} from "$lib/stores/User.ts";
  import {page} from "$app/stores";
  let { exports } = ExportStore;

  let unsubFilterStore: Unsubscriber;
  let unsubExportStore: Unsubscriber;

  export let panelOpen = false;

  function openPanel() {
    panelOpen = true;
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

  $: isDiscoverPage = $page && $page.url.pathname.includes("/discover");

  function disablePanel() : boolean {
    console.log("disablePanel() called. Page = " + ($page && $page.url.pathname))
    if (!isDiscoverPage) {
      let isValidForExplore = get(hasInvalidFilter(get(user).queryScopes || []));
      console.log("Not discover page. Is valid = " + isValidForExplore);
      return isValidForExplore;
    } else {
      console.log("Discover page. Is valid = " + ($hasGenomicFilter || $hasUnallowedFilter))
      return $hasGenomicFilter || $hasUnallowedFilter;
    }
  }

  $: shouldDisablePanel = disablePanel();
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
    justify-content: top;
    width: 42px;
    padding: 0 0.25rem;
  }
  #side-panel-bar #results-panel-toggle {
    margin-top: 2.3rem;
  }
</style>
