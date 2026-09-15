<script lang="ts">
  import type { TableHandler } from '@vincjo/datatables/server';

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
    /** `stores/Search`'s handler. Named for the preference key `getDefaultRows` reads. */
    tableName: string;
    handler: TableHandler<SearchResult>;
    isLoading?: boolean;
    section: SearchSection;
    searchTerm?: string;
    options?: number[];
    onPageChange?: () => void;
  }

  let {
    tableName,
    handler,
    isLoading = false,
    section,
    searchTerm = '',
    options = [5, 10, 20, 50, 100],
    onPageChange,
  }: Props = $props();
</script>

<div id="search-results" data-testid="search-results" class="space-y-1">
  {#if isLoading}
    <div class="flex justify-center items-center py-8">
      <Loading ring size="small" color="primary" />
    </div>
  {:else if handler.rows.length > 0}
    <ul data-testid="search-result-list" aria-label="Search results" class="list-none space-y-3">
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
      <RowsPerPage {tableName} {handler} {options} />
      <Pagination {handler} {onPageChange} />
    </div>
  </footer>
</div>
