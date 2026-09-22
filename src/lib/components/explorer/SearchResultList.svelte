<script lang="ts">
  import type { TableHandler } from '@vincjo/datatables/server';

  import {
    pendingPageFocusStatus,
    type PendingPageFocus,
  } from '$lib/components/datatable/pageFocus';
  import type { PageChangeSource } from '$lib/components/datatable/types';
  import type { SearchSection } from '$lib/explorer/variableUrl';
  import type { SearchResult } from '$lib/models/Search';

  import RowCount from '$lib/components/datatable/accessories/Count.svelte';
  import Pagination from '$lib/components/datatable/accessories/Pagination.svelte';
  import RowsPerPage from '$lib/components/datatable/accessories/Rows.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import SearchResultCard from '$lib/components/explorer/SearchResultCard.svelte';

  interface Props {
    /** The key `getDefaultRows`/`setDefaultRows` store the user's rows-per-page choice under. */
    tableName: string;
    handler: TableHandler<SearchResult>;
    isLoading?: boolean;
    section: SearchSection;
    options?: number[];
    onPageChange?: () => void;
  }

  let {
    tableName,
    handler,
    isLoading = false,
    section,
    options = [5, 10, 20, 50, 100],
    onPageChange,
  }: Props = $props();

  let listElement: HTMLUListElement | undefined = $state();

  // Not `$state`: see `pendingPageFocusStatus`.
  let pendingPageFocus: PendingPageFocus | null = null;

  function resultCards(): HTMLElement[] {
    return Array.from(listElement?.querySelectorAll<HTMLElement>(':scope > li > a') ?? []);
  }

  /**
   * `handler.rows` here is the outgoing page: this runs from `Pagination`, synchronously after
   * `setPage`, and the server handler `stores/Search` builds replaces rows only when its fetch
   * resolves.
   *
   * Only the keyboard registers a focus request - a mouse user's pointer is still where they
   * left it.
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
    const cards = resultCards();
    const status = pendingPageFocusStatus(pendingPageFocus, handler, isLoading, cards.length);
    if (status === 'waiting') return;
    pendingPageFocus = null;
    if (status === 'stale') return;
    cards[0].focus();
    // `nearest`, so this agrees with the caller's own scroll on a page change rather than
    // fighting it for the viewport.
    cards[0].scrollIntoView?.({ block: 'nearest' });
  });
</script>

<div id="search-results" data-testid="search-results" class="space-y-1">
  {#if isLoading}
    <div class="flex justify-center items-center py-8">
      <Loading ring size="small" color="primary" />
    </div>
  {:else if handler.rows.length > 0}
    <!-- role="list" spelled out: `list-none` removes the bullets, and with them Safari and
         VoiceOver drop the list semantics, so the group would no longer be announced as one. -->
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
          <SearchResultCard {result} {section} />
        </li>
      {/each}
    </ul>
  {:else}
    <p data-testid="search-results-empty">No entries found.</p>
  {/if}
  <footer class="flex justify-between mt-3">
    <RowCount {handler} />
    <div class="flex justify-end gap-4">
      <RowsPerPage {tableName} {handler} {options} />
      <Pagination {handler} onPageChange={onPaged} />
    </div>
  </footer>
</div>
