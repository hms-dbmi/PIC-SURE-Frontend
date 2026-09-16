import { filteringRefused } from '$lib/explorer/variableFilter';
import type { SearchSection } from '$lib/explorer/searchChrome';
import type { SearchResult } from '$lib/models/Search';
import { isUserLoggedIn } from '$lib/stores/User';

/**
 * Whether the visitor is looking at a search section under open access.
 *
 * Not `AccessState.isOpenAccess()`, which decides by `page.url.pathname.includes('/discover')`.
 * Below a section root the path carries dictionary data, so
 * `/explorer/variable/discover/<concept>` is a legitimate URL for a dataset named `discover`
 * and reads as Discover under that rule - which would hide Add for Analysis from a logged-in
 * Explore user and refuse them a filter. Every caller here already knows which section it is
 * in, so it is asked rather than inferred. The other half of the rule, an anonymous visitor,
 * is unchanged.
 */
export function isOpenAccessSection(section: SearchSection): boolean {
  return section === 'discover' || !isUserLoggedIn();
}

/**
 * Whether the dictionary and the access level between them bar filtering on this variable.
 *
 * The rule the results row's filter icon applied before the redesign - `Actions.svelte` had
 * `isOpenAccess() && !row.allowFiltering` - and open access *and* the dictionary refusing,
 * not either alone: an authenticated Explore user may filter a variable Discover would not
 * offer, and an open-access visitor may filter most of them.
 *
 * One definition, because three places now have to agree about it. The result card says
 * before the click what the detail page enforces after it, and a card that reads as
 * filterable opening onto a refusal is worse than no marking at all; the filter panel applies
 * the same rule to each related variable under the main one.
 *
 * The variable-and-access half is `filteringRefused`, which the panel calls directly - it
 * holds an `openAccess` boolean per panel rather than a section. Delegating rather than
 * restating it keeps the three call sites on one predicate, which is the whole point of this
 * function: two spellings of one rule is how the card and the page drift apart.
 */
export function isFilteringBlocked(
  section: SearchSection,
  variable: Pick<SearchResult, 'allowFiltering'> | undefined,
): boolean {
  return variable !== undefined && filteringRefused(variable, isOpenAccessSection(section));
}

/**
 * What the user is told about such a variable, wherever they meet it.
 *
 * The wording `Actions.svelte` used on the disabled filter button, kept verbatim so the card
 * and the detail page do not offer a user two different accounts of one rule.
 */
export const FILTERING_UNAVAILABLE = 'Filtering is not available for this variable';
