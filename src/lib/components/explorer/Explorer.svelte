<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { config } from '$lib/configuration.svelte';
  import {
    searchTerm,
    selectedFacets,
    tableHandler as handler,
    error,
    tour,
    resetSearch,
    loading as isLoading,
  } from '$lib/stores/Search';
  import type { TourDataType } from '$lib/models/Tour';

  import type { SearchSection } from '$lib/explorer/variableUrl';
  import SearchResultList from '$lib/components/explorer/SearchResultList.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExplorerTour from '$lib/components/tour/ExplorerTour.svelte';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  let searchInput = $state(page.url.searchParams.get('search') || $searchTerm || '');

  // The box holds typing the user has not submitted, so it cannot be derived from the store -
  // but it has to follow the store whenever something else moves it, or the box and the rows
  // below it end up showing different searches. The layout applies ?search= on navigations
  // this component does not remount for, which is when that happens.
  let boxTerm = $state($searchTerm);
  $effect(() => {
    const term = $searchTerm;
    if (untrack(() => boxTerm) === term) return;
    boxTerm = term;
    searchInput = term;
  });

  // Still 'ExplorerTable': it is the key `getDefaultRows`/`setDefaultRows` store the user's
  // rows-per-page choice under, and `stores/Search` reads that same key when it builds the
  // handler. Renaming it here would silently drop everyone's saved page size.
  const tableName = 'ExplorerTable';
  let isDiscoverPage = $derived(page.url.pathname.includes('/discover'));
  let section: SearchSection = $derived(isDiscoverPage ? 'discover' : 'explorer');
  let path = $derived(isDiscoverPage ? '/discover' : '/explorer');

  function update() {
    if ($error) error.set('');
    searchTerm.set(searchInput);

    goto(
      resolve(
        (searchInput ? `${path}?search=${encodeURIComponent(searchInput)}` : `${path}`) as '/',
      ),
      {
        replaceState: true,
      },
    );
  }

  function reset() {
    resetSearch();
    searchInput = '';

    goto(resolve(path as '/'));
  }

  function scrollToSearchResults() {
    document.getElementById('search-results')?.scrollIntoView({ block: 'start' });
  }

  onMount(() => {
    if (page.url.searchParams.get('startTour') === 'true') {
      const tourBtn = document.querySelector('#explorer-tour-btn');
      if (tourBtn) {
        (tourBtn as HTMLElement).click();
      }
    }
  });
</script>

<section id="search-container" class="flex gap-9">
  <div id="facet-side-bar" class="flex-none flex-col items-center w-80">
    <FacetSideBar />
  </div>
  <div id="search-results-col" class="flex-auto">
    <div id="search-bar" class="flex gap-2 mb-6">
      <div class="flex-auto">
        <Searchbox bind:searchTerm={searchInput} search={update} />
      </div>
      <div class="flex-none">
        <button
          type="button"
          class="btn preset-tonal-error border border-error-500 hover:preset-filled-error-500"
          aria-label="You are on the reset button"
          disabled={!searchInput && $selectedFacets.length === 0}
          onclick={reset}
        >
          Reset
        </button>
      </div>
    </div>
    {#if $error}
      <ErrorAlert title="Sorry, we could not retrieve your search results." color="secondary">
        {$error}
      </ErrorAlert>
    {:else if $searchTerm || $selectedFacets.length > 0}
      <SearchResultList
        {tableName}
        {handler}
        {section}
        isLoading={$isLoading}
        onPageChange={scrollToSearchResults}
      />
    {/if}
    {#if config.features.explorer.enableTour && $tour}
      <div id="explorer-tour" class="text-center mt-4">
        <ExplorerTour {tourConfig} />
      </div>
    {/if}
  </div>
</section>
