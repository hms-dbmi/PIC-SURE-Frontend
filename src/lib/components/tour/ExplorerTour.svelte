<script lang="ts">
  import { driver, type DriverHook, type DriveStep } from 'driver.js';
  import 'driver.js/dist/driver.css';
  import '../../../styles/tour.css';

  import { searchTerm, selectedFacets, searchPromise } from '$lib/stores/Search';
  import { clearFilters } from '$lib/stores/Filter';
  import { clearExports } from '$lib/stores/Export';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  import Modal from '$lib/components/Modal.svelte';
  import Loading from '$lib/components/Loading.svelte';

  let {
    tourConfig,
  }: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    tourConfig: any;
  } = $props();

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
    clearFilters();
    clearExports();
  }

  const applyNumericFilter = (activeRowSelector?: string) => {
    const filter = document.querySelector(
      `#${activeRowSelector} [data-testid="add-filter"]`,
    ) as HTMLInputElement;

    filter.click();
    tourDriver.moveNext();
  };

  const clickFilterOption = (activeRowSelector?: string) => {
    const allOptions = document.querySelector(
      `#${activeRowSelector} #select-all`,
    ) as HTMLInputElement;
    allOptions?.click();

    setTimeout(() => {
      const addFilter = document.querySelector(
        `#${activeRowSelector} [data-testid="add-filter"]`,
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

      if (step.removeHighlightClass) {
        serializedStep.removeHighlightClass = functionMap[step.removeHighlightClass];
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
    overlayColor: 'var(--color-surface-400)',
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
    started = true;
    openDrawer();
    resetSearch();

    // Load search in bg then start tour
    const searchBox = document.querySelector('#explorer-search-box') as HTMLInputElement;
    searchBox.value = tourConfig.searchTerm;
    $searchTerm = tourConfig.searchTerm;

    await $searchPromise
      .then(() => tourDriver.drive())
      .catch(() => console.error('API returned error during tour.'));
  }
</script>

<Modal
  bind:open={openModal}
  title={tourConfig?.title}
  confirmText="Start Tour"
  onconfirm={startTour}
  withDefault={false}
  width="w-1/3"
>
  {#if started}
    <Loading ring size="large" />
  {:else}
    <p>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(tourConfig?.description)}
    </p>
    <footer class="modal-footer flex justify-end space-x-2 mt-6">
      <button
        type="button"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={() => (openModal = false)}>Cancel</button
      >
      <button type="button" class="btn preset-filled-primary-500" onclick={startTour}
        >Start Tour</button
      >
    </footer>
  {/if}
</Modal>
<button
  type="button"
  data-testid="explorer-tour-btn"
  id="tourBtn"
  class="btn preset-filled-secondary-500 text-black hover:text-white"
  onclick={() => {
    started = false;
    openModal = true;
  }}
  >Take a Tour
</button>
