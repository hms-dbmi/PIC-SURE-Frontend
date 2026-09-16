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
    criteriaGeneration,
    error,
    tour,
    resetSearch,
    loading as isLoading,
  } from '$lib/stores/Search';
  import type { TourDataType } from '$lib/models/Tour';
  import { isDiscoverSection, type SearchSection } from '$lib/explorer/searchChrome';
  import { genotypesMode } from '$lib/explorer/searchModes';

  import SearchResultList from '$lib/components/explorer/SearchResultList.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExplorerTour from '$lib/components/tour/ExplorerTour.svelte';
  import { log, createLog } from '$lib/logger';

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
  const rowsPreferenceKey = 'ExplorerTable';
  // Declared once, by the component that scrolls it: the list takes the id it is given, so a
  // second list on a page cannot end up sharing this one.
  const resultsId = 'search-results';
  // By segment, never by substring: below the section root the path carries dictionary data,
  // so a dataset named `discover` must not read as the Discover section.
  let isDiscoverPage = $derived(isDiscoverSection(page.url.pathname));
  let section: SearchSection = $derived(isDiscoverPage ? 'discover' : 'explorer');
  let path = $derived(isDiscoverPage ? '/discover' : '/explorer');
  // Same gate as the Genotypes mode, from the one definition of it - this button and that
  // link are two entry points to the same thing.
  let allowGenomicFiltering = $derived(genotypesMode.enabled(isDiscoverPage));

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
    document.getElementById(resultsId)?.scrollIntoView({ block: 'start' });
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
        {#if allowGenomicFiltering}
          <a
            data-testid="genomic-filter-btn"
            class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
            href={resolve('/explorer/genome-filter')}
            onclick={() => log(createLog('NAVIGATION', 'explorer.genomic_filter_click'))}
            >Genomic Filtering</a
          >
        {/if}
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
        id={resultsId}
        {rowsPreferenceKey}
        {handler}
        {section}
        isLoading={$isLoading}
        searchTerm={$searchTerm}
        criteriaGeneration={$criteriaGeneration}
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
