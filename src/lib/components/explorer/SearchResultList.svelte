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
  }: Props = $props();

  let listElement: HTMLUListElement | undefined = $state();

  /**
   * A keyboard page change that has not yet been given its new cards to focus.
   *
   * The same mechanism `RemoteTable` used for its arrow-key paging, and the same reason it
   * needs one: the handler moves `currentPage` synchronously but only replaces `rows` after a
   * debounced fetch, with a loading placeholder in between that destroys the cards entirely.
   * So the request is held until the rows identity actually changes; a page that no longer
   * matches by then means the data moved for some other reason - a new search, a facet - and
   * the focus request is stale.
   *
   * Not state: nothing renders from it, and making it reactive would have the effect below
   * re-run on its own clearing.
   */
  let pendingPageFocus: { page: number; rowsAtRequest: SearchResult[] } | null = null;

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
   *
   * `handler.rows` here is the outgoing page: this runs from `Pagination`, synchronously after
   * `setPage`, and the server handler that `stores/Search` builds replaces rows only when its
   * fetch resolves.
   */
  function onPaged(source: PageChangeSource) {
    if (source === 'keyboard') {
      pendingPageFocus = { page: handler.currentPage, rowsAtRequest: handler.rows };
    }
    onPageChange?.();
  }

  $effect(() => {
    void handler.rows;
    void isLoading;
    if (!pendingPageFocus) return;
    const { page, rowsAtRequest } = pendingPageFocus;
    if (handler.rows === rowsAtRequest) return;
    if (handler.currentPage !== page) {
      pendingPageFocus = null;
      return;
    }
    const cards = resultCards();
    if (!cards.length) {
      // The loading placeholder is still up; retry when it clears. Once it has, a page with
      // no cards is a page with nothing to focus.
      if (isLoading) return;
      pendingPageFocus = null;
      return;
    }
    pendingPageFocus = null;
    cards[0].focus();
    // `nearest`, so this agrees with the caller's own scroll on a page change rather than
    // fighting it for the viewport.
    cards[0].scrollIntoView?.({ block: 'nearest' });
  });
</script>

<div {id} data-testid="search-results" class="space-y-1">
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
    <p data-testid="search-results-empty">No entries found.</p>
  {/if}
  <footer class="flex justify-between mt-3">
    <RowCount {handler} />
    <div class="flex justify-end gap-4">
      <RowsPerPage tableName={rowsPreferenceKey} {handler} {options} />
      <Pagination {handler} onPageChange={onPaged} />
    </div>
  </footer>
</div>
