<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { config } from '$lib/configuration.svelte';

  import Content from '$lib/components/Content.svelte';
  import FilterType from '$lib/components/explorer/genome-filter/FilterType.svelte';
  import GeneSearch from '$lib/components/explorer/genome-filter/GeneSearch.svelte';
  import SnpSearch from '$lib/components/explorer/genome-filter/SNPSearch.svelte';

  import { Option } from '$lib/models/GenomeFilter';
  import { genomicFilterMethod } from '$lib/state/genomicFilterMethod.svelte';
  import { addFilter } from '$lib/stores/Filter';
  import { clearGeneFilters, generateGenomicFilter, selectedGenes } from '$lib/stores/GeneFilter';
  import { panelOpen } from '$lib/stores/ResultsSummaryPanel';
  import { clearSnpFilters, generateSNPFilter, selectedSNPs } from '$lib/stores/SNPFilter';

  /**
   * The method a deployment with a single query type leaves no choice about. BDC enables
   * GENE alone, so the tab opens straight onto the gene-variant panels and never shows the
   * chooser. `undefined` means the user picks.
   */
  const forcedMethod = $derived.by(() => {
    const { enableGENEQuery, enableSNPQuery } = config.features;
    if (enableGENEQuery && !enableSNPQuery) return Option.Genomic;
    if (!enableGENEQuery && enableSNPQuery) return Option.SNP;
    return undefined;
  });

  // Configuration wins outright where it decides, so the remembered method is read only in
  // the case it can be set in.
  const method = $derived(forcedMethod ?? genomicFilterMethod.current);
  const showsMethodChooser = $derived(forcedMethod === undefined);

  const canComplete = $derived(
    (method === Option.Genomic && $selectedGenes.length > 0) ||
      (method === Option.SNP && $selectedSNPs.length > 0),
  );
  const actionTitle = $derived(
    canComplete ? 'Add Filter' : method === Option.SNP ? 'A SNP is required' : 'A gene is required',
  );

  function onComplete() {
    addFilter(method === Option.Genomic ? generateGenomicFilter() : generateSNPFilter());
    // The working state has become the filter, so the tab starts over: empty panels, and the
    // chooser again where there is one. Same as the page this replaces.
    clearGeneFilters();
    clearSnpFilters();
    genomicFilterMethod.current = Option.None;
    $panelOpen = true;
    goto(resolve('/explorer'));
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Genotypes</title>
</svelte:head>

<Content full>
  <div data-testid="genotypes-tab">
    {#if showsMethodChooser}
      <FilterType
        class="my-4"
        onselect={(option) => (genomicFilterMethod.current = option)}
        active={method}
      />
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
