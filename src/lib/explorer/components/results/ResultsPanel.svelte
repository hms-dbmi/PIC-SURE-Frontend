<script lang="ts">
  import { buttonClass } from '#lib/ui/button.ts';
  import { resolve } from '$app/paths';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import { slide, scale } from 'svelte/transition';

  import { page } from '$app/state';
  import { afterNavigate, goto } from '$app/navigation';

  import { config } from '#lib/config/config.svelte.ts';

  import { filterState } from '#lib/query/filters.svelte.ts';
  import { resultCountsState } from '#lib/query/counts/resultCounts.svelte.ts';
  import { exports, clearExports } from '#lib/explorer/export/Export.ts';
  import { exploreMode } from '#lib/explorer/mode.ts';
  import { resultsPanelRules } from '#lib/explorer/resultsPanelRules.ts';

  import Filters from '#lib/explorer/components/results/Filters.svelte';
  import ExportedVariable from '#lib/explorer/components/results/ExportedVariable.svelte';
  import CardButton from '#lib/ui/CardButton.svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import Counts from '#lib/explorer/components/results/Counts.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import Button from '#lib/ui/Button.svelte';

  const isDiscoverPage = $derived(exploreMode() === 'discover');
  let modalOpen: boolean = $state(false);

  const rules = $derived(
    resultsPanelRules({
      mode: exploreMode(),
      features: config.features,
      filterTypes: filterState.all.map((filter) => filter.filterType),
      hasGenomicFilter: filterState.hasGenomicFilter,
      exportCount: $exports.length,
      counts: resultCountsState,
    }),
  );

  // Untracked, so a change of mode reruns the count only through the restart below.
  const getIsOpenAccess = () => untrack(() => isDiscoverPage);

  // A navigation that keeps this panel mounted (explorer to discover, say) would otherwise let a
  // count still pending for the old page land on the new one. Leaving the page the panel counted
  // for restarts the count with the new mode, dropping the old result.
  let countedPage = page.url.pathname;
  afterNavigate(() => {
    if (!page.url.pathname.startsWith(countedPage)) {
      countedPage = page.url.pathname;
      resultCountsState.start(getIsOpenAccess);
    }
  });

  onMount(() => {
    resultCountsState.start(getIsOpenAccess);
  });
  onDestroy(() => {
    resultCountsState.stop();
  });
</script>

<ConfirmDialog
  bind:open={modalOpen}
  title="Clear All Filters"
  confirmLabel="Yes"
  cancelLabel="No"
  onconfirm={() => {
    filterState.clear();
    clearExports();
  }}
>
  Are you sure you want to clear all filters?
</ConfirmDialog>
<section
  id="results-panel"
  class="flex flex-col items-center pt-8 pr-10 w-64"
  transition:slide={{ axis: 'x' }}
>
  <Counts />
  {#if rules.showExportButton}
    <div class="h-11 mt-4">
      <button
        id="results-export-open"
        type="button"
        class={buttonClass()}
        disabled={resultCountsState.loading}
        onclick={() => {
          log(createLog('ACTION', 'explorer.prepare_for_analysis'));
          goto(resolve('explorer/export'));
        }}
        transition:scale={{ easing: elasticInOut }}
      >
        Prepare for Analysis
      </button>
    </div>
  {/if}
  <div id="results-export-filters" class="flex flex-col items-center mt-7 w-80">
    <hr />
    <div class="flex content-center items-center mt-6">
      <h5 class="flex-auto ml-9 mr-2 mb-2 pt-1">Filtered Data Summary</h5>
      {#if rules.hasFilterOrExport}
        <Button
          data-testid="results-reset"
          variant="tonal-error"
          size="xs"
          class="flex-none"
          onclick={() => (modalOpen = true)}>Reset</Button
        >
      {/if}
    </div>
    <Filters {isDiscoverPage} />
    {#if $exports.length > 0}
      <div class="px-4 mb-1 w-80">
        <header class="text-left ml-1" data-testid="results-exports-header">
          Added Variables
          {#if $exports.length > 10}
            <button
              data-testid="results-exports-clear"
              class="anchor text-sm flex-none float-right mr-2"
              onclick={() => {
                $exports = [];
              }}>Clear</button
            >
          {/if}
        </header>
        <section class="py-1">
          {#each $exports as variable (variable.id)}
            <ExportedVariable {variable} />
          {/each}
        </section>
      </div>
    {/if}
  </div>
  {#if rules.distributionsPage || rules.showVariantExplorer}
    <div class="flex flex-col items-center mt-7">
      <hr />
      <h5 class="text-center mt-7">Tool Suite</h5>
      <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">
        {#if rules.distributionsPage}
          <CardButton
            href={resolve(rules.distributionsPage)}
            id="results-distributions-open"
            data-testid="results-distributions-open"
            title="Variable Distributions"
            icon="fa-solid fa-chart-pie"
            size="md"
            disabled={rules.distributionsDisabled}
          />
        {/if}
        {#if rules.showVariantExplorer}
          <CardButton
            href={resolve('explorer/variant')}
            data-testid="results-variant-explorer-open"
            title="Variant Explorer"
            icon="fa-solid fa-dna"
            size="md"
            active={page.url.pathname.includes('explorer/variant')}
          />
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  hr {
    width: 88%;
  }
</style>
