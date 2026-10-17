<script lang="ts">
  import { driver, type DriverHook, type DriveStep } from 'driver.js';
  import 'driver.js/dist/driver.css';
  import '../../../../styles/tour.css';

  import { config } from '#lib/config/config.svelte.ts';
  import { flatIndex } from '#lib/utils/objects.ts';

  import { searchTerm, selectedFacets, nextSearchSettled } from '#lib/explorer/Search.ts';
  import { expandedNestedFacets } from '#lib/explorer/NestedFacets.ts';
  import { isToastShowing, toaster } from '#lib/ui/toaster.ts';
  import { clearFilters } from '#lib/query/filters.ts';
  import { clearExports } from '#lib/explorer/export/Export.ts';
  import { sanitizeHTML } from '#lib/utils/html.ts';
  import type { TourDataType } from '#lib/explorer/components/tour/types.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import Loading from '#lib/ui/Loading.svelte';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  const TOUR_ERROR_TOAST = 'tour-search-error';

  let started: boolean = $state(false);
  let openModal: boolean = $state(false);

  const disablePrevious = () => {};

  const clickElement: DriverHook = (element?: Element) => {
    (element as HTMLElement)?.click();
  };

  const clickElementThenNext: DriverHook = (element?: Element) => {
    (element as HTMLElement)?.click();
    tourDriver.moveNext();
  };

  // In this case we are return a function of type DriverHook
  const addHighlightClass = (on: boolean): DriverHook => {
    return (element?: Element) => {
      if (on) {
        (element as HTMLElement).classList.add('highlight');
      } else {
        (element as HTMLElement).classList.remove('highlight');
      }
    };
  };

  function resetSearch() {
    searchTerm.set('');
    expandedNestedFacets.set([]);
    clearFilters();
    clearExports();
  }

  const applyNumericFilter = (activeRowSelector?: string) => {
    const filter = document.querySelector(
      `#${activeRowSelector} [data-testid="filter-add"]`,
    ) as HTMLInputElement;

    filter.click();
    tourDriver.moveNext();
  };

  const clickFilterOption = (activeRowSelector?: string) => {
    const allOptions = document.querySelector(
      `#${activeRowSelector} [data-testid="ui-options-selection-list-select-all"]`,
    ) as HTMLInputElement;
    allOptions?.click();

    setTimeout(() => {
      const addFilter = document.querySelector(
        `#${activeRowSelector} [data-testid="filter-add"]`,
      ) as HTMLInputElement;
      addFilter?.click();
      tourDriver.moveNext();
    }, 200);
  };

  function openDrawer() {
    const sidePanel = document.querySelector('#results-panel-toggle') as HTMLElement;
    sidePanel.click();
  }

  const applyFilterThenNext: DriverHook = (element?: Element) => {
    const activeRowId = element?.id;
    const filterType = document.querySelector(`#${activeRowId} [data-testid="filter-numerical"]`)
      ? 'numerical'
      : 'categorical';
    if (filterType === 'numerical') {
      applyNumericFilter(activeRowId);
    } else {
      clickFilterOption(activeRowId);
    }
  };

  /*
  This is used to replace the placeholder in the tour configuration with the actual search term.
  This is used for the title and description of the popover.
   */
  function replacePlaceholders(text: string, searchTerm: string): string {
    return text.replace(/\{\{searchTerm\}\}/g, searchTerm);
  }

  const findAndSetFirstNonStigmatizedAvailableFilterThenNext: DriverHook = () => {
    // click the first row that doesn't have a disabled filter button
    // Work from the table rows to find the first one that has a filter button
    const table = document.querySelector('#explorer-table') as HTMLTableElement;
    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let filter = row.querySelector('button.row-action-filter:not(:disabled)') as
        | HTMLElement
        | undefined;
      if (filter) {
        row.classList.add('non-stigmatized-row');
        break;
      }
    }
    tourDriver.moveNext();
  };

  type FunctionMap = {
    [key: string]: DriverHook;
  };

  /*
  This object maps the function names in the tour configuration to the actual functions
  that will be executed when the tour reaches that step. If the function is not in this
  map, the tour will throw an error.
   */
  const functionMap: FunctionMap = {
    disablePrevious,
    clickElement,
    clickElementThenNext,
    addHighlightClass: addHighlightClass(true),
    removeHighlightClass: addHighlightClass(false),
    resetSearch,
    applyFilterThenNext,
    findAndSetFirstNonStigmatizedAvailableFilterThenNext,
  };

  // This method will serialize the json configuration to a DriveStep array
  // that driver.js can use for the tour steps
  // It will map the function names in pop over to actual functions
  /* eslint-disable @typescript-eslint/no-explicit-any */
  function mapConfigurationToSteps(steps: any = []): DriveStep[] {
    const flatFeatures = flatIndex(config.features);
    return steps
      .filter(
        ({ dependsOnFeature = '' }: { dependsOnFeature: string }) =>
          !dependsOnFeature || flatFeatures[dependsOnFeature],
      )
      .map((step: any) => {
        const { popover, ...rest } = step;
        delete rest.dependsOnFeature;
        const serializedStep: any = {
          ...rest,
          popover: {
            ...popover,
            title: replacePlaceholders(popover.title, tourConfig.searchTerm),
            description: replacePlaceholders(popover.description, tourConfig.searchTerm),
          },
        };

        if (popover.onPrevClick) {
          serializedStep.popover.onPrevClick = functionMap[popover.onPrevClick];
        }

        if (popover.onNextClick) {
          serializedStep.popover.onNextClick = functionMap[popover.onNextClick];
        }

        if (step.onHighlightStarted) {
          serializedStep.onHighlightStarted = functionMap[step.onHighlightStarted];
        }

        if (step.removeHighlightClass) {
          serializedStep.removeHighlightClass = functionMap[step.removeHighlightClass];
        }

        return serializedStep;
      });
  }

  // svelte-ignore state_referenced_locally
  const steps = mapConfigurationToSteps(tourConfig.steps);

  // Notes:
  // - The object that we want to interact with must be fully loaded in the dom before the step that interracts with it,
  // otherwise the tour can not find the element at step start time. For this reason, we're loading some things in
  // the step before, or adding steps to open components we'll need later.
  const tourDriver = driver({
    showProgress: true,
    popoverClass: 'picsure-theme',
    overlayColor: 'var(--color-surface-400)',
    // Although we're not using the previous button, this would be it's custom text
    // prevBtnText: '<i class="fa-solid fa-arrow-left mr-1"></i> Previous',
    nextBtnText: 'Next <i class="fa-solid fa-arrow-right ml-1"></i>',

    // Even if previous button is disabled, navigating with the left arrow key still seems to trigger,
    // so we'll disable it in each step.
    showButtons: ['next', 'close'],
    disableButtons: ['previous'],

    steps: steps,
    onHighlightStarted: (_element, step, { state }) => {
      if (state.activeIndex && state.activeIndex > 0) {
        log(
          createLog('ACTION', 'tour.next', {
            pageContext: getPageContext(),
            step: state.activeIndex,
          }),
        );
      }
    },
    onDestroyed: () => {
      log(
        createLog('ACTION', 'tour.exit', {
          pageContext: getPageContext(),
          lastStep: tourDriver.getActiveIndex(),
        }),
      );
      resetSearch();
      selectedFacets.set([]);
      const sidePanel = document.querySelector('#results-side-panel') as HTMLElement;
      if (sidePanel.classList.contains('open-panel')) {
        (document.querySelector('#results-panel-toggle') as HTMLElement)?.click();
      }
      const searchBox = document.querySelector('#explorer-search-box') as HTMLInputElement;
      searchBox.value = '';
      searchBox.focus();
    },
  });

  async function startTour() {
    log(createLog('ACTION', 'tour.start', { pageContext: getPageContext() }));
    started = true;
    openDrawer();
    resetSearch();

    const searchBox = document.querySelector('#explorer-search-box') as HTMLInputElement;
    searchBox.value = tourConfig.searchTerm;

    $searchTerm = tourConfig.searchTerm;

    const outcome = await nextSearchSettled();
    if (outcome !== 'loaded') {
      console.error(`Search did not load during tour (${outcome}).`);
      started = false;
      if (!isToastShowing(TOUR_ERROR_TOAST)) {
        toaster.error({
          id: TOUR_ERROR_TOAST,
          duration: 5000,
          title:
            'We could not load the example search needed for the tour. Please try again in a moment.',
          closable: true,
        });
      }
      return;
    }
    tourDriver.drive();
  }
</script>

{#snippet tourActions()}
  <button
    type="button"
    class="btn border preset-tonal-primary hover:preset-filled-primary-500"
    onclick={() => (openModal = false)}>Cancel</button
  >
  <button type="button" class="btn preset-filled-primary-500" onclick={startTour}>Start Tour</button
  >
{/snippet}

<Dialog
  bind:open={openModal}
  title={tourConfig.title}
  size="third"
  footer={started ? undefined : tourActions}
>
  {#if started}
    <Loading ring size="large" />
  {:else}
    <p>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(tourConfig.description)}
    </p>
  {/if}
</Dialog>
<button
  type="button"
  data-testid="explorer-tour-start"
  id="explorer-tour-start"
  class="btn preset-filled-secondary-500"
  onclick={() => {
    started = false;
    openModal = true;
    log(createLog('ACTION', 'tour.open', { pageContext: getPageContext() }));
  }}
  >Take a Tour
</button>
