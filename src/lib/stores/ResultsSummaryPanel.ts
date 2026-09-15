import { writable } from 'svelte/store';

/**
 * Whether the cohort summary panel's body is expanded. Module-level, so a panel the user
 * opened or collapsed by hand stays that way for the rest of the page load, across every
 * route under the Explore and Discover layouts and across the two of them.
 *
 * Keep this module a leaf - `svelte/store` and nothing else. Most of what imports it wants
 * only the boolean, and one of those is `/login/loading`: `stores/Filter` JSON.parses
 * sessionStorage at module init with no error handling, so pulling that in here would let a
 * malformed `filterTree` blob - which nothing clears on logout - throw on the one route a
 * user could log in from to clear it.
 */
export const panelOpen = writable(false);

/**
 * The cohort the panel last looked at. Module-level rather than per-component because a
 * panel instance is not the thing this has to be remembered for: Explore and Discover render
 * one each, leaving either destroys it, and a fresh instance's first read of the stores
 * replays a cohort it has never seen before.
 *
 * Only a mounted panel writes it, which is what makes "changed while nothing was watching"
 * detectable at all.
 */
const NO_COHORT = { size: 0, signature: '' };
let lastSeen = NO_COHORT;

/**
 * Expands the panel if `size` and `signature` describe a cohort that grew, or that was
 * rewritten without shrinking, since the panel last looked. Records them either way.
 *
 * The three things this deliberately does not open for:
 *
 * - **An empty cohort.** There would be nothing to show.
 * - **A removal.** Auto-expand exists so an addition is not hidden; taking something away is
 *   not a reason to overrule a collapse the user chose. A shrinking cohort is the signal,
 *   because a removal is the only way to shrink one.
 * - **An unchanged query.** This covers both a second panel instance reading a cohort that is
 *   already accounted for, and the several mutators in `stores/Filter.ts` that write the
 *   store having changed nothing - `removeUnallowedFilters` with nothing unallowed, say.
 *
 * Everything else opens it: a filter, a genomic filter or an added variable appearing, and a
 * query rewritten in place by the Advanced Query Builder's Apply, which changes operators and
 * grouping while the size stays put.
 */
export function autoOpenForCohort(size: number, signature: string): void {
  const previous = lastSeen;
  lastSeen = { size, signature };

  if (size === 0) return;
  if (size < previous.size) return;
  if (signature === previous.signature) return;

  panelOpen.set(true);
}

/**
 * Forgets both the panel's state and the cohort behind it, for a session that is starting
 * over. Resetting `panelOpen` on its own would leave the next panel comparing against the
 * previous session's cohort.
 */
export function resetPanel(): void {
  panelOpen.set(false);
  lastSeen = NO_COHORT;
}
