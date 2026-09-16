<script lang="ts">
  import { get } from 'svelte/store';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { config } from '$lib/configuration.svelte';

  import Content from '$lib/components/Content.svelte';
  import FilterType from '$lib/components/explorer/genome-filter/FilterType.svelte';
  import GeneSearch from '$lib/components/explorer/genome-filter/GeneSearch.svelte';
  import SnpSearch from '$lib/components/explorer/genome-filter/SNPSearch.svelte';

  import { phenotypesMode, searchModeHref } from '$lib/explorer/searchModes';
  import type {
    Filter,
    GenomicFilterInterface,
    SnpFilterInterface,
  } from '$lib/models/Filter.svelte';
  import { Option } from '$lib/models/GenomeFilter';
  import { addFilter, genomicFilters } from '$lib/stores/Filter';
  import { generateGenomicFilter, selectedGenes } from '$lib/stores/GeneFilter';
  import { loadGenomicDrafts, type AppliedGenomicFilters } from '$lib/stores/GenomicDraft';
  import { filterMethod } from '$lib/stores/GenomicFilterMethod';
  import { searchTerm } from '$lib/stores/Search';
  import { panelOpen } from '$lib/stores/ResultsSummaryPanel';
  import { generateSNPFilter, selectedSNPs } from '$lib/stores/SNPFilter';

  // The gene and variant working state above - selections, consequences, frequencies - lives
  // in module-level stores, so that switching search modes does not lose a draft in progress.
  // This tab is the only thing that loads or clears them wholesale, by way of
  // `loadGenomicDrafts`, which is what lets `draftLoadedFrom` be trusted.

  /**
   * The method a deployment with a single query type leaves no choice about. BDC enables
   * GENE alone, so the tab opens straight onto the gene-variant panels and never shows the
   * chooser. `undefined` covers both of the cases where this cannot decide: both types
   * enabled, where the user picks; and neither, where there is nothing to pick and the mode
   * is not offered at all - `+page.ts` redirects that case away before this renders, and the
   * chooser `undefined` yields would say so anyway.
   */
  function methodForcedBy({ enableGENEQuery, enableSNPQuery }: typeof config.features) {
    if (enableGENEQuery && !enableSNPQuery) return Option.Genomic;
    if (!enableGENEQuery && enableSNPQuery) return Option.SNP;
    return undefined;
  }

  const choosesMethod = () => methodForcedBy(config.features) === undefined;

  const forcedMethod = $derived(methodForcedBy(config.features));

  // Configuration wins outright where it decides, so the remembered method is only read in
  // the case it can be set in - a method carried over from elsewhere cannot strand a
  // deployment on an interface it has not enabled.
  const method = $derived(forcedMethod ?? $filterMethod);
  const showsMethodChooser = $derived(choosesMethod());

  // There is only ever one filter of each genomic method, so the tab has no separate edit
  // mode: whatever the cohort holds is what the panels show, and the action button replaces it.
  function appliedIn(filters: Filter[]): AppliedGenomicFilters {
    return {
      gene: filters.find((f): f is GenomicFilterInterface => f.filterType === 'genomic'),
      snp: filters.find((f): f is SnpFilterInterface => f.filterType === 'snp'),
    };
  }

  const applied = $derived(appliedIn($genomicFilters));
  const updates = $derived(
    method === Option.SNP ? applied.snp !== undefined : applied.gene !== undefined,
  );

  // Loaded here rather than only in the effect below, so that the panels are built from the
  // drafts instead of catching up to them: the gene panel reads the selection as it mounts, to
  // keep a gene the filter names among its options whether or not the values endpoint's first
  // page has it, and an effect runs after that. Read plainly rather than through the derived
  // values above, which at this point hold nothing but their initial value anyway.
  loadGenomicDrafts(appliedIn(get(genomicFilters)), choosesMethod());

  // And again whenever the cohort's genomic filters change under an open tab, which is how
  // removing the filter from its chip empties the panels it was loaded into.
  $effect(() => {
    loadGenomicDrafts(applied, showsMethodChooser);
  });

  const canComplete = $derived(
    (method === Option.Genomic && $selectedGenes.length > 0) ||
      (method === Option.SNP && $selectedSNPs.length > 0),
  );
  const actionLabel = $derived(updates ? 'Update Filter' : 'Add Filter');
  const actionTitle = $derived(
    canComplete ? actionLabel : method === Option.SNP ? 'A SNP is required' : 'A gene is required',
  );

  function onComplete() {
    // There is nothing to build without a method. The button only renders behind one, but
    // that is an invariant of the template below, and on its own it would make `None` mean
    // SNP here.
    if (method === Option.None) return;

    // `addFilter` replaces by id, and both genomic ids are fixed, so this updates the applied
    // filter rather than adding a second one.
    addFilter(method === Option.Genomic ? generateGenomicFilter() : generateSNPFilter());
    // The draft is not cleared: it has become the filter, and the tab shows the applied filter
    // now, so coming back to it has to find the panels holding what the cohort holds.
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
          {actionLabel}
          <i class="fa-solid {updates ? 'fa-check' : 'fa-plus'} ml-3"></i>
        </button>
      </div>
    {/if}
  </div>
</Content>
