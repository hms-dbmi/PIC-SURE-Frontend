import { writable } from 'svelte/store';

/**
 * Whether the cohort summary panel's body is expanded. Module-level, so a panel the user
 * opened or collapsed by hand stays that way for the rest of the page load, across every
 * route under the Explore and Discover layouts and across the two of them.
 *
 * Keep this module a leaf - `svelte/store` and nothing else. Most of what imports it wants
 * only the boolean, and one of those is `/login/loading`.
 *
 * That matters because `stores/Filter` JSON.parses sessionStorage at module init with no
 * error handling, so a malformed `filterTree` or `genomicFilters` value throws before
 * anything renders. That hazard is still there and is tracked separately - nothing here
 * fixes it. What keeping this module a leaf does is keep `/login/loading` out of its blast
 * radius, so the one route a user could log in from to clear the bad value does not go down
 * with Explore and Discover.
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
interface SeenCohort {
  items: Set<string>;
  structure: string;
}

const noCohort = (): SeenCohort => ({ items: new Set(), structure: '' });
let lastSeen = noCohort();

/**
 * Expands the panel if `items` and `structure` describe a cohort the user has something new
 * to see in, compared with the last one a panel looked at. Records them either way.
 *
 * The question is membership, not how many: did the cohort gain anything it did not hold
 * before? A count cannot answer that, because one transaction can add and remove at once -
 * a dataset restored over an existing cohort routinely lands smaller while carrying entirely
 * new filters, and that is a restore the user asked for and must see.
 *
 * So, in order:
 *
 * - **Nothing to show.** No filters, no genomic filters, no added variables: never open.
 * - **Something gained.** Any identity that was not there before, whatever else went away in
 *   the same breath. This is an addition, a restore, and a replacement.
 * - **Only losses.** Nothing gained and something gone: a removal, which is not a reason to
 *   overrule a collapse the user chose. An Advanced Query Builder Apply that only deletes
 *   filters lands here too, deliberately.
 * - **The same items, combined differently.** The Advanced Query Builder's Apply rewriting
 *   operators or grouping, which changes no membership at all.
 * - **Nothing changed.** A second panel instance reading a cohort already accounted for, or
 *   one of the mutators in `stores/Filter.ts` that writes the store having changed nothing.
 */
export function autoOpenForCohort(items: readonly string[], structure: string): void {
  const previous = lastSeen;
  const current = new Set(items);
  lastSeen = { items: current, structure };

  if (current.size === 0) return;

  if (items.some((item) => !previous.items.has(item))) {
    panelOpen.set(true);
    return;
  }

  for (const item of previous.items) {
    if (!current.has(item)) return;
  }

  if (structure !== previous.structure) panelOpen.set(true);
}

/**
 * Forgets both the panel's state and the cohort behind it, for a session that is starting
 * over. Resetting `panelOpen` on its own would leave the next panel comparing against the
 * previous session's cohort.
 */
export function resetPanel(): void {
  panelOpen.set(false);
  lastSeen = noCohort();
}
