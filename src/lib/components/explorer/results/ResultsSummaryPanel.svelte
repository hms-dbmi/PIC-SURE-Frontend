<script module lang="ts">
  // Explore and Discover render their own instance of this panel, from their own layout, so a
  // navigation between the two has one instance mounting and another unmounting. Svelte does
  // not promise an order for that, and `resultCountsState.stop()` cancels whatever load is in
  // flight - so the teardown only fires for the instance that still owns the counts.
  let countsOwner: object | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/state';

  import { config } from '$lib/configuration.svelte';
  import { showsSearchChrome } from '$lib/explorer/searchChrome';
  import { allFilters } from '$lib/stores/Filter';
  import { cohortContents } from '$lib/stores/Cohort';
  import { autoOpenForCohort, panelOpen } from '$lib/stores/ResultsSummaryPanel';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { sanitizeHTML } from '$lib/utilities/HTML';
  import { log, createLog } from '$lib/logger';

  import Counts from '$lib/components/explorer/results/Counts.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  // The body is deliberately one child: the chip redesign replaces this import and nothing else.
  import ResultsPanel from '$lib/components/explorer/results/ResultsPanel.svelte';

  const BODY_ID = 'results-panel-body';

  let visible = $derived(showsSearchChrome(page.url.pathname));
  let filterCount = $derived($allFilters.length);
  let filterSummary = $derived(
    filterCount === 0
      ? 'No filters added, add below'
      : `${filterCount} filter${filterCount === 1 ? '' : 's'} added`,
  );
  let hasCountError = $derived(
    !resultCountsState.loading && resultCountsState.snapshot.summary.hasError,
  );

  const instance = {};
  // Read once, not derived: this instance belongs to whichever of the two layouts created it
  // and never crosses to the other, so the section cannot change under it - and a reactive
  // read here would land inside the $effect below, restarting the counts on every navigation
  // within the layout.
  const isOpenAccess = page.url.pathname.includes('/discover');
  const getIsOpenAccess = () => isOpenAccess;

  // Tied to `visible`, not to mount: the layout keeps this component alive across every child
  // route, so gating only the markup would leave the count subscription reloading on
  // /explorer/export and /explorer/distributions - where the strip must not render at all, and
  // where Summary.svelte's ensureLoaded() would race a load we had already started.
  $effect(() => {
    if (!visible) return;
    countsOwner = instance;
    resultCountsState.start(getIsOpenAccess);
    return () => {
      if (countsOwner !== instance) return;
      countsOwner = null;
      resultCountsState.stop();
    };
  });

  // The panel expands itself when the cohort gains something, so that the chip, the added
  // variable or the rebuilt query is visible where it landed instead of behind a click. It
  // watches the stores rather than relying on each caller to remember, because adding to the
  // cohort has many entry points and two of them have no UI on this page at all: a
  // sessionStorage tree restored by a page load, and a dataset restore that fills the stores
  // before navigating here.
  //
  // `autoOpenForCohort` decides; see it for what does and does not count.
  onMount(() =>
    cohortContents.subscribe(({ items, structure }) => autoOpenForCohort(items, structure)),
  );

  function toggle() {
    panelOpen.update((open) => {
      log(createLog('ACTION', 'results_panel.toggle', { open: !open }));
      return !open;
    });
  }
</script>

{#if visible}
  <section
    id="results-summary-panel"
    data-testid="results-summary-panel"
    aria-label="Cohort summary"
    class="card bg-surface-50-950 border border-surface-300-700 rounded-container"
  >
    <button
      type="button"
      id="results-panel-toggle"
      data-testid="results-summary-strip"
      class="w-full flex items-center justify-between gap-4 px-6 py-3 text-left cursor-pointer rounded-container hover:bg-surface-100-900"
      aria-expanded={$panelOpen}
      aria-controls={BODY_ID}
      onclick={toggle}
    >
      <Counts />
      <span class="flex items-center gap-4">
        <span data-testid="results-panel-filter-count">{filterSummary}</span>
        <i class="fa-solid {$panelOpen ? 'fa-chevron-down' : 'fa-chevron-right'}" aria-hidden="true"
        ></i>
      </span>
    </button>
    <!-- The count's only error report: start() does not toast, so this has to be here. -->
    {#if hasCountError}
      <ErrorAlert color="warning" iconSize="2xl" data-testid="count-error-alert">
        <p class="text-sm !m-0">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html sanitizeHTML(config.branding.explorePage.queryErrorText)}
        </p>
      </ErrorAlert>
    {/if}
    <!-- Rendered whether or not the panel is open so `aria-controls` always resolves. -->
    <div id={BODY_ID} data-testid="results-panel-body">
      {#if $panelOpen}
        <ResultsPanel />
      {/if}
    </div>
  </section>
{/if}
