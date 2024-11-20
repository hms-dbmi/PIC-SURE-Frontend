<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  export let tourConfig: any;
  import { getModalStore, type ModalComponent } from '@skeletonlabs/skeleton';

  import { driver, type DriverHook, type DriveStep } from 'driver.js';
  import 'driver.js/dist/driver.css';
  import '../../../tour.postcss';

  import { searchTerm, selectedFacets, loading } from '$lib/stores/Search';
  import { clearFilters } from '$lib/stores/Filter';
  import { clearExports } from '$lib/stores/Export';

  import TourModal from '$lib/components/tour/TourModal.svelte';

  const modalStore = getModalStore();
  const tourComponent: ModalComponent = { ref: TourModal, props: { tourConfig } };

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
    clearFilters();
    clearExports();
  }

  const applyNumericFilter = (activeRowSelector?: string) => {
    const filter = document.querySelector(
      `${activeRowSelector} [data-testid="add-filter"]`,
    ) as HTMLElement;

    filter.click();
    tourDriver.moveNext();
  };

  const clickFilterOption = (activeRowSelector?: string) => {
    const allOptions = document.querySelector(
      `#${activeRowSelector} #select-all`,
    ) as HTMLInputElement;
    allOptions?.click();

    const addFilter = document.querySelector(
      `#${activeRowSelector} [data-testid="add-filter"]`,
    ) as HTMLElement;
    addFilter.click();

    tourDriver.moveNext();
  };

  function openDrawer() {
    const sidePanel = document.querySelector('#results-panel-toggle') as HTMLElement;
    sidePanel.click();
  }

  const applyFilterThenNext: DriverHook = (element?: Element) => {
    const activeRowId = element?.id;
    const filterType = document.querySelector(`#${activeRowId} [data-testid="numerical-filter"]`)
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
    // #ExplorerTable-table
    const table = document.querySelector('#ExplorerTable-table') as HTMLTableElement;
    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let filter = row.querySelector('button[title="Filter"]') as HTMLElement | undefined;
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
  function mapConfigurationToSteps(steps: any): DriveStep[] {
    return steps.map((step: any) => {
      const { popover, ...rest } = step;
      const serializedStep: any = {
        ...rest,
        popover: {
          ...popover,
          title: replacePlaceholders(popover.title, tourConfig?.searchTerm),
          description: replacePlaceholders(popover.description, tourConfig?.searchTerm),
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

      return serializedStep;
    });
  }

  const steps = mapConfigurationToSteps(tourConfig.steps);

  // Notes:
  // - The object that we want to interact with must be fully loaded in the dom before the step that interracts with it,
  // otherwise the tour can not find the element at step start time. For this reason, we're loading some things in
  // the step before, or adding steps to open components we'll need later.
  const tourDriver = driver({
    showProgress: true,
    popoverClass: 'picsure-theme',
    overlayColor: 'rgb(var(--color-surface-400) / .7)',
    // Although we're not using the previous button, this would be it's custom text
    // prevBtnText: '<i class="fa-solid fa-arrow-left mr-1"></i> Previous',
    nextBtnText: 'Next <i class="fa-solid fa-arrow-right ml-1"></i>',

    // Even if previous button is disabled, navigating with the left arrow key still seems to trigger,
    // so we'll disable it in each step.
    showButtons: ['next', 'close'],
    disableButtons: ['previous'],

    steps: steps,
    onDestroyed: () => {
      resetSearch();
      selectedFacets.set([]);
      const sidePanel = document.querySelector('#side-panel') as HTMLElement;
      if (sidePanel.classList.contains('open-panel')) {
        (document.querySelector('#results-panel-toggle') as HTMLElement)?.click();
      }
      const searchBox = document.querySelector('#explorer-search-box') as HTMLInputElement;
      searchBox.value = '';
      searchBox.focus();
    },
  });

  async function startTour() {
    modalStore.trigger({
      type: 'component',
      component: tourComponent,
      buttonTextConfirm: 'Start Tour',
      response: async (start: boolean) => {
        if (!start) return;

        resetSearch();
        openDrawer();

        // Load search in bg then start tour
        const searchBox = document.querySelector('#explorer-search-box') as HTMLInputElement;
        searchBox.value = tourConfig.searchTerm;
        searchBox.dispatchEvent(new Event('input'));
        searchBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        await $loading
          .then(() => {
            modalStore.close();
            tourDriver.drive();
          })
          .catch(() => console.error('API returned error during tour.'));
      },
    });
  }
</script>

<button
  type="button"
  data-testid="explorer-tour-btn"
  id="tourBtn"
  class="btn variant-filled-secondary"
  on:click={startTour}
  >Take a Tour
</button>
