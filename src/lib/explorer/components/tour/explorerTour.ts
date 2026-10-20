import { driver } from 'driver.js';

import { config } from '#lib/config/config.svelte.ts';
import { flatIndex } from '#lib/utils/objects.ts';
import { explorerSearch } from '#lib/explorer/search.svelte.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import { clearExports } from '#lib/explorer/export/Export.ts';
import { isToastShowing, toaster } from '#lib/ui/toaster.ts';
import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';
import type { TourDataType } from '#lib/explorer/components/tour/types.ts';
import { tourSteps } from '#lib/explorer/components/tour/tourSteps.ts';
import {
  closeResultsPanel,
  openResultsPanel,
  setSearchBox,
  tourHooks,
} from '#lib/explorer/components/tour/tourActions.ts';

const TOUR_ERROR_TOAST = 'tour-search-error';

function resetSearch() {
  explorerSearch.setTerm('');
  explorerSearch.collapseNestedFacets();
  filterState.clear();
  clearExports();
}

/**
 * A driver.js tour of the explorer page. It runs the configuration's example search, walks the
 * steps, and on exit clears what it searched and filtered.
 */
export function createExplorerTour(tourConfig: TourDataType) {
  const hooks = tourHooks(() => tourDriver.moveNext(), resetSearch);

  // A step's element must be in the DOM when the step starts, so the configuration opens what a
  // later step needs in the step before it.
  const tourDriver = driver({
    showProgress: true,
    popoverClass: 'picsure-theme',
    overlayColor: 'var(--color-surface-400)',
    nextBtnText: 'Next <i class="fa-solid fa-arrow-right ml-1"></i>',
    // The left arrow key still goes back with the button hidden, so it's disabled too.
    showButtons: ['next', 'close'],
    disableButtons: ['previous'],
    steps: tourSteps(tourConfig, flatIndex(config.features), hooks),
    onHighlightStarted: (_element, _step, { state }) => {
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
      explorerSearch.setFacets([]);
      closeResultsPanel();
      setSearchBox('', { focus: true });
    },
  });

  return {
    /** Runs the example search and starts the tour. False when the search didn't load. */
    async start(): Promise<boolean> {
      log(createLog('ACTION', 'tour.start', { pageContext: getPageContext() }));
      openResultsPanel();
      resetSearch();
      setSearchBox(tourConfig.searchTerm);
      explorerSearch.setTerm(tourConfig.searchTerm);

      const outcome = await explorerSearch.nextSettled();
      if (outcome !== 'loaded') {
        console.error(`Search did not load during tour (${outcome}).`);
        if (!isToastShowing(TOUR_ERROR_TOAST)) {
          toaster.error({
            id: TOUR_ERROR_TOAST,
            duration: 5000,
            title:
              'We could not load the example search needed for the tour. Please try again in a moment.',
            closable: true,
          });
        }
        return false;
      }
      tourDriver.drive();
      return true;
    },
  };
}
