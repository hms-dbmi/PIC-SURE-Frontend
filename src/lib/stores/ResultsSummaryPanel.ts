import { derived, writable, type Readable } from 'svelte/store';

import { exports } from '$lib/stores/Export';
import { filterTree, genomicFilters } from '$lib/stores/Filter';

/**
 * Whether the cohort summary panel's body is expanded. Module-level, so a panel the user
 * opened or collapsed by hand stays that way for the rest of the page load, across every
 * route under the Explore and Discover layouts and across the two of them.
 */
export const panelOpen = writable(false);

export interface CohortContents {
  /** Nothing filtered, nothing added for analysis - the panel's body has nothing to show. */
  isEmpty: boolean;
  /**
   * Changes when, and only when, the cohort's contents change. The panel compares this
   * across its own mounts to tell a cohort that grew while no panel existed - a dataset
   * restore, or a tree read back out of sessionStorage by a page load - from the same cohort
   * seen by a second panel instance, which must not re-open a deliberate collapse.
   */
  revision: string;
}

/**
 * The three stores that decide what the cohort summary panel's body has to show, as one
 * subscription.
 *
 * The revision is built from the tree's serialization rather than a filter count because the
 * Advanced Query Builder's Apply rewrites operators and grouping without changing how many
 * filters there are, and that still has to register as a change.
 */
export const cohortContents: Readable<CohortContents> = derived(
  [filterTree, genomicFilters, exports],
  ([$filterTree, $genomicFilters, $exports]) => ({
    isEmpty:
      $filterTree.leafNodes.length === 0 && $genomicFilters.length === 0 && $exports.length === 0,
    revision: [
      $filterTree.serialized,
      ...$genomicFilters.map((filter) => filter.uuid),
      ...$exports.map((exported) => exported.conceptPath),
    ].join('\n'),
  }),
);
