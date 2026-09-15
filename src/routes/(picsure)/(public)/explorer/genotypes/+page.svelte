<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { config } from '$lib/configuration.svelte';

  import Content from '$lib/components/Content.svelte';
  import FilterType from '$lib/components/explorer/genome-filter/FilterType.svelte';
  import GeneSearch from '$lib/components/explorer/genome-filter/GeneSearch.svelte';
  import SnpSearch from '$lib/components/explorer/genome-filter/SNPSearch.svelte';

  import { phenotypesMode, searchModeHref } from '$lib/explorer/searchModes';
  import { Option } from '$lib/models/GenomeFilter';
  import { addFilter } from '$lib/stores/Filter';
  import { clearGeneFilters, generateGenomicFilter, selectedGenes } from '$lib/stores/GeneFilter';
  import { filterMethod } from '$lib/stores/GenomicFilterMethod';
  import { searchTerm } from '$lib/stores/Search';
  import { panelOpen } from '$lib/stores/SidePanel';
  import { clearSnpFilters, generateSNPFilter, selectedSNPs } from '$lib/stores/SNPFilter';

  // The gene and variant working state above - selections, consequences, frequencies - is
  // shared with /explorer/genome-filter, which is still reachable and which both clears it on
  // its way out and overwrites it from the applied filter on its way in. So a detour through
  // that page does change what this one is holding. `filterMethod` is the exception: that
  // page keeps its own page-local method and never touches this store. None of it is
  // isolated and none of it is meant to be - the two are the same feature behind two entry
  // points for as long as both exist, and deleting the old one is what closes it.

  /**
   * The method a deployment with a single query type leaves no choice about. BDC enables
   * GENE alone, so the tab opens straight onto the gene-variant panels and never shows the
   * chooser. `undefined` covers both of the cases where this cannot decide: both types
   * enabled, where the user picks; and neither, where there is nothing to pick and the mode
   * is not offered at all - `+page.ts` redirects that case away before this renders, and the
   * chooser `undefined` yields would say so anyway.
   */
  const forcedMethod = $derived.by(() => {
    const { enableGENEQuery, enableSNPQuery } = config.features;
    if (enableGENEQuery && !enableSNPQuery) return Option.Genomic;
    if (!enableGENEQuery && enableSNPQuery) return Option.SNP;
    return undefined;
  });

  // Configuration wins outright where it decides, so the remembered method is only read in
  // the case it can be set in - a method carried over from elsewhere cannot strand a
  // deployment on an interface it has not enabled.
  const method = $derived(forcedMethod ?? $filterMethod);
  const showsMethodChooser = $derived(forcedMethod === undefined);

  const canComplete = $derived(
    (method === Option.Genomic && $selectedGenes.length > 0) ||
      (method === Option.SNP && $selectedSNPs.length > 0),
  );
  const actionTitle = $derived(
    canComplete ? 'Add Filter' : method === Option.SNP ? 'A SNP is required' : 'A gene is required',
  );

  function onComplete() {
    // There is nothing to build without a method. The button only renders behind one, but
    // that is an invariant of the template below, and on its own it would make `None` mean
    // SNP here.
    if (method === Option.None) return;

    addFilter(method === Option.Genomic ? generateGenomicFilter() : generateSNPFilter());
    // The working state has become the filter, so the tab starts over: empty panels, and the
    // chooser again where there is one.
    clearGeneFilters();
    clearSnpFilters();
    filterMethod.set(Option.None);
    $panelOpen = true;
    // Back to Phenotypes, from the registry rather than a literal, carrying the search so the
    // address bar still agrees with the results the user returns to.
    goto(resolve(searchModeHref(phenotypesMode, $searchTerm) as '/'));
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Genotypes</title>
</svelte:head>

<!-- No title of its own and no back button: the search-mode bar the layout renders above this
     is the page's navigation, and a second one would only compete with it. -->
<Content full>
  <div data-testid="genotypes-tab">
    {#if showsMethodChooser}
      <FilterType class="my-4" onselect={(option) => filterMethod.set(option)} active={method} />
    {/if}
    {#if method === Option.Genomic}
      <GeneSearch class="mb-0 mt-6" />
    {:else if method === Option.SNP}
      <SnpSearch class="mt-6" />
    {/if}
    {#if method !== Option.None}
      <div class="flex justify-center my-4">
        <button
          data-testid="add-filter-btn"
          type="button"
          class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"
          title={actionTitle}
          onclick={onComplete}
          disabled={!canComplete}
        >
          Add Filter <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {/if}
  </div>
</Content>
