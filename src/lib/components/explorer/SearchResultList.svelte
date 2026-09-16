<script lang="ts">
  import type { TableHandler } from '@vincjo/datatables/server';

  import type { PageChangeSource } from '$lib/components/datatable/types';
  import type { SearchSection } from '$lib/explorer/searchChrome';
  import type { SearchResult } from '$lib/models/Search';

  import RowCount from '$lib/components/datatable/accessories/Count.svelte';
  import Pagination from '$lib/components/datatable/accessories/Pagination.svelte';
  import RowsPerPage from '$lib/components/datatable/accessories/Rows.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import SearchResultCard from '$lib/components/explorer/SearchResultCard.svelte';

  /**
   * The search results, as a list of cards.
   *
   * The paging is unchanged: this renders the same server-side `TableHandler` the results
   * table did, and keeps the same three accessories below the list, so the abort and
   * generation logic in `stores/Search` and the facet-refetch coupling are untouched. Only
   * the row rendering moved.
   */
  interface Props {
    /** Owned by the caller, which is also what scrolls the list into view on a page change. */
    id: string;
    /** What `getDefaultRows`/`setDefaultRows` key the user's rows-per-page choice on. */
    rowsPreferenceKey: string;
    handler: TableHandler<SearchResult>;
    isLoading?: boolean;
    section: SearchSection;
    searchTerm?: string;
    options?: number[];
    onPageChange?: () => void;
    /**
     * Which search the rows on screen are answering - `stores/Search`'s `criteriaGeneration`.
     * A change to it supersedes a pending focus request; see `pendingPageFocus` below.
     */
    criteriaGeneration?: number;
  }

  let {
    id,
    rowsPreferenceKey,
    handler,
    isLoading = false,
    section,
    searchTerm = '',
    options = [5, 10, 20, 50, 100],
    onPageChange,
    criteriaGeneration = 0,
  }: Props = $props();

  let listElement: HTMLUListElement | undefined = $state();
  let emptyElement: HTMLParagraphElement | undefined = $state();

  /**
   * What a screen reader is told when a page change moves focus.
   *
   * Focus landing on the first card announces *that card*, which is not the same as saying
   * the page turned or which page it is now - someone who pages and hears a variable name
   * cannot tell whether they moved one page or five. `RemoteTable` announced this and the card
   * list has to as well.
   *
   * Cleared then set, so that paging twice to the same page number is still announced the
   * second time, and cleared again afterwards so stale text is not left in the live region for
   * a reader that wanders into it.
   */
  let announcement = $state('');
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  function announce(text: string) {
    clearTimeout(announceTimer);
    announcement = '';
    announceTimer = setTimeout(() => {
      announcement = text;
      announceTimer = setTimeout(() => (announcement = ''), 5000);
    }, 30);
  }

  /**
   * A keyboard page change that has not yet been given its new cards to focus.
   *
   * The same mechanism `RemoteTable` used for its arrow-key paging, and the same reason it
   * needs one: the handler moves `currentPage` synchronously but only replaces `rows` after a
   * debounced fetch, with a loading placeholder in between that destroys the cards entirely.
   * So the request is held until the rows identity actually changes.
   *
   * It records what it asked for, not only where it was going. The destination alone is not
   * an identity: a facet click or a new search calls `tableHandler.setPage(1)` too
   * (`stores/Search`, `onCriteriaChange`), so rows answering *that* arrive on the page a
   * backwards page change was waiting for, pass both checks, and take focus off the checkbox
   * the user is working in. `criteriaGeneration` is what tells those two responses apart, and
   * `rowsPerPage` catches the third way the rows can be replaced without the page moving.
   *
   * Not state: nothing renders from it, and making it reactive would have the effect below
   * re-run on its own clearing.
   */
  let pendingPageFocus: {
    page: number;
    rowsPerPage: number;
    criteriaGeneration: number;
    rowsAtRequest: SearchResult[];
  } | null = null;

  function resultCards(): HTMLElement[] {
    return Array.from(
      listElement?.querySelectorAll<HTMLElement>('[data-testid="search-result-card"]') ?? [],
    );
  }

  /**
   * Only the keyboard registers a focus request. That is the whole of the mouse/keyboard
   * split: a mouse user's pointer is still where they left it and moving focus out from under
   * them steals it, where a keyboard user has just activated a pagination button and would
   * otherwise be left tabbing back down the page to reach the results they asked for.
   * `Pagination` calls "keyboard" for assistive-technology activation too, which presents the
   * same way and wants the same thing.
   *
   * A mouse page change *clears* rather than being ignored. Left alone, a request made from
   * the keyboard and then superseded by mouse paging would be spent by whichever arrival
   * happened to match it.
   *
   * `handler.rows` here is the outgoing page: this runs from `Pagination`, synchronously after
   * `setPage`, and the server handler that `stores/Search` builds replaces rows only when its
   * fetch resolves.
   */
  function onPaged(source: PageChangeSource) {
    pendingPageFocus =
      source === 'keyboard'
        ? {
            page: handler.currentPage,
            rowsPerPage: handler.rowsPerPage,
            criteriaGeneration,
            rowsAtRequest: handler.rows,
          }
        : null;
    onPageChange?.();
  }

  $effect(() => {
    void handler.rows;
    void isLoading;
    const generation = criteriaGeneration;
    if (!pendingPageFocus) return;
    const request = pendingPageFocus;
    if (handler.rows === request.rowsAtRequest) return;
    // Anything the request did not ask for drops it rather than spending it on rows that
    // answer someone else's question.
    if (
      handler.currentPage !== request.page ||
      handler.rowsPerPage !== request.rowsPerPage ||
      generation !== request.criteriaGeneration
    ) {
      pendingPageFocus = null;
      return;
    }
    const cards = resultCards();
    if (!cards.length) {
      // The loading placeholder is still up; retry when it clears.
      if (isLoading) return;
      // A page that came back empty. Focus the message saying so rather than let the browser
      // drop to the body: the pagination the user activated from can be unrendered by this
      // same response (it is gated on the handler having pages at all), so there may be
      // nothing left where they were standing.
      pendingPageFocus = null;
      emptyElement?.focus();
      announce('No entries found.');
      return;
    }
    pendingPageFocus = null;
    cards[0].focus();
    // `nearest`, so this agrees with the caller's own scroll on a page change rather than
    // fighting it for the viewport.
    cards[0].scrollIntoView?.({ block: 'nearest' });
    announce(`Page ${handler.currentPage} of ${handler.pages?.length ?? 1}`);
  });
</script>

<div {id} data-testid="search-results" class="space-y-1">
  <div class="sr-only" aria-live="polite" data-testid="search-results-announcer">
    {announcement}
  </div>
  {#if isLoading}
    <div class="flex justify-center items-center py-8">
      <Loading ring size="small" color="primary" />
    </div>
  {:else if handler.rows.length > 0}
    <!-- `role="list"` alongside `list-none`: `list-style: none` takes the list semantics away
         in Safari and VoiceOver, and the aria-label goes with them. The table this replaced
         gave the same group a <caption>. -->
    <ul
      bind:this={listElement}
      role="list"
      data-testid="search-result-list"
      aria-label="Search results"
      class="list-none space-y-3"
    >
      <!-- Unkeyed: the cards hold no state worth preserving across a page change, and a
           concept path is not guaranteed unique across datasets - a keyed block would throw
           on a duplicate rather than render it. -->
      {#each handler.rows as result}
        <li>
          <SearchResultCard {result} {section} {searchTerm} />
        </li>
      {/each}
    </ul>
  {:else}
    <!-- `tabindex="-1"` for the same reason an unopenable card has one: a page change that
         comes back empty has to put focus somewhere, and this is the only thing left. -->
    <p bind:this={emptyElement} data-testid="search-results-empty" tabindex="-1">
      No entries found.
    </p>
  {/if}
  <footer class="flex justify-between mt-3">
    <RowCount {handler} />
    <div class="flex justify-end gap-4">
      <RowsPerPage tableName={rowsPreferenceKey} {handler} {options} />
      <Pagination {handler} onPageChange={onPaged} />
    </div>
  </footer>
</div>
