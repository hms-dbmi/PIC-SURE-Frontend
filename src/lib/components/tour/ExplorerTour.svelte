<script lang="ts">
  import { getModalStore, type ModalComponent } from '@skeletonlabs/skeleton';

  import { driver } from 'driver.js';
  import 'driver.js/dist/driver.css';
  import '../../../tour.postcss';

  import { branding } from '$lib/configuration';
  import { searchTerm, selectedFacets, loading } from '$lib/stores/Search';
  import { clearFilters } from '$lib/stores/Filter';
  import { clearExports } from '$lib/stores/Export';

  import TourModal from '$lib/components/tour/TourModal.svelte';

  const modalStore = getModalStore();
  const tourComponent: ModalComponent = { ref: TourModal };

  const disablePrevious = () => {};

  function clickElement(element?: Element) {
    (element as HTMLElement)?.click();
  }

  function clickElementThenNext(element?: Element) {
    (element as HTMLElement)?.click();
    tourDriver.moveNext();
  }

  function addHighlightClass(on: boolean) {
    return (element?: Element) => {
      if (on) {
        (element as HTMLElement).classList.add('highlight');
      } else {
        (element as HTMLElement).classList.remove('highlight');
      }
    };
  }

  function resetSearch() {
    searchTerm.set('');
    clearFilters();
    clearExports();
  }

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

    steps: [
      {
        // Step 1
        element: '#explorer-search-box',
        popover: {
          title: 'Search',
          description: 'Search clinical variables of interest.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 2
        element: '#search-button',
        popover: {
          title: 'Search',
          description: 'Press the Enter key or click the search icon to submit your search.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 3
        element: '#ExplorerTable-table',
        popover: {
          title: 'Search results',
          description:
            'The results of the search are displayed in this area. Each row describes a different variable that matches your search result.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 4
        element: '[data-testid=genomic-filter-btn]',
        popover: {
          title: 'Add a genomic Filter',
          description:
            'Use the genomic filtering button to apply a filter using genomic information. \n Note* you can also search for genomic variables using the search bar.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 5
        element: '#row-0-col-2 button[title=Filter]',
        onHighlightStarted: clickElement,
        popover: {
          title: 'Add a filter',
          description:
            'To view available filters for a variable, click on the filter icon in the row of interest.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 6
        element: '#active-row-0 [data-testid=numerical-filter]',
        popover: {
          title: 'Add numeric filter',
          description:
            'To add a numeric filter, enter the min and max values you want in the filter.',
          onPrevClick: disablePrevious,
          onNextClick: () => {
            const min = document.querySelector(
              '#active-row-0 [data-testid=numerical-filter] input#min',
            ) as HTMLInputElement;
            const max = document.querySelector(
              '#active-row-0 [data-testid=numerical-filter] input#max',
            ) as HTMLInputElement;
            min.value = '2';
            max.value = '4';
            tourDriver.moveNext();
          },
        },
      },
      {
        // Step 7
        element: '#active-row-0 [data-testid=add-filter]',
        popover: {
          title: 'Add numeric filter',
          description: 'Click the plus icon to add the filter',
          onPrevClick: disablePrevious,
          onNextClick: clickElementThenNext,
        },
      },
      {
        // Step 8
        element: '#sidebar-right',
        popover: {
          title: 'Filters added',
          description: 'Any filters added will end up in the results sidebar.',
        },
      },
      {
        // Step 9
        element: '#row-1-col-2 button[title=Filter]',
        onHighlightStarted: clickElement,
        popover: {
          title: 'Add categorical filter',
          description: 'You can continue to add filters.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 10
        element: '#active-row-1 #options-container',
        popover: {
          title: 'Add categorical filter',
          description:
            'To add a categorical filter, click on the options you want to include in the filter.',
          onPrevClick: disablePrevious,
          onNextClick: () => {
            const firstOption = document.querySelector(
              '#active-row-1 #options-container label:nth-child(1)',
            ) as HTMLInputElement;
            firstOption?.click();
            tourDriver.moveNext();
          },
        },
      },
      {
        // Step 11
        element: '#active-row-1 [data-testid=add-filter]',
        popover: {
          title: 'Add categorical filter',
          description: 'Click the plus icon to add the filter',
          onPrevClick: disablePrevious,
          onNextClick: clickElementThenNext,
        },
      },
      {
        // Step 12
        element: '#sidebar-right',
        popover: {
          title: 'Added filters',
          description:
            'You can view, edit, or delete previously added filters from the result sidebar.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 13
        element: '#row-0-col-2 button[title="Data Export"]',
        popover: {
          title: 'Add a varible to export',
          description:
            'Add a varible to exported data by clicking the export icon on the variable of interest.',
          onPrevClick: disablePrevious,
          onNextClick: clickElementThenNext,
        },
      },
      {
        // Step 14
        element: '#sidebar-right',
        popover: {
          title: 'Added exports',
          description:
            'You can view, or delete previously added variables for export from the result sidebar.',
          onPrevClick: disablePrevious,
        },
      },
      {
        // Step 15
        element: '#nav-link-help',
        onHighlighted: addHighlightClass(true),
        onDeselected: addHighlightClass(false),
        popover: {
          title: 'Get help',
          description:
            'To learn more about these features, consult the documentation and use the information links throughout the site.',
          onPrevClick: disablePrevious,
        },
      },
    ],
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

        // Load search in bg then start tour
        const searchBox = document.querySelector('#explorer-search-box') as HTMLInputElement;
        searchBox.value = branding?.explorePage?.tourSearchTerm;
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
  class="btn variant-ghost-secondary hover:variant-filled-secondary"
  on:click={startTour}>Take a Tour</button
>
