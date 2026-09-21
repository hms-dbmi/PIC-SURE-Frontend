<script lang="ts">
  import { get } from 'svelte/store';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { config } from '$lib/configuration.svelte';

  import Content from '$lib/components/Content.svelte';
  import FilterType from '$lib/components/explorer/genome-filter/FilterType.svelte';
  import GeneSearch from '$lib/components/explorer/genome-filter/GeneSearch.svelte';
  import SnpSearch from '$lib/components/explorer/genome-filter/SNPSearch.svelte';

  import type {
    Filter,
    GenomicFilterInterface,
    SnpFilterInterface,
  } from '$lib/models/Filter.svelte';
  import { Option } from '$lib/models/GenomeFilter';
  import { genomicFilterMethod } from '$lib/state/genomicFilterMethod.svelte';
  import { addFilter, genomicFilters } from '$lib/stores/Filter';
  import { generateGenomicFilter, selectedGenes } from '$lib/stores/GeneFilter';
  import { loadGenomicDrafts, type AppliedGenomicFilters } from '$lib/stores/GenomicDraft';
  import { panelOpen } from '$lib/stores/ResultsSummaryPanel';
  import { generateSNPFilter, selectedSNPs } from '$lib/stores/SNPFilter';

  const forcedMethod = $derived.by(() => {
    const { enableGENEQuery, enableSNPQuery } = config.features;
    if (enableGENEQuery && !enableSNPQuery) return Option.Genomic;
    if (!enableGENEQuery && enableSNPQuery) return Option.SNP;
    return undefined;
  });

  const method = $derived(forcedMethod ?? genomicFilterMethod.current);
  const showsMethodChooser = $derived(forcedMethod === undefined);

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
  // drafts instead of catching up to them: the gene panel reads the selection as it mounts,
  // and an effect runs after that.
  loadGenomicDrafts(appliedIn(get(genomicFilters)));

  $effect(() => {
    loadGenomicDrafts(applied);
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
    // `addFilter` replaces by id, and both genomic ids are fixed, so this updates the applied
    // filter rather than adding a second one.
    addFilter(method === Option.Genomic ? generateGenomicFilter() : generateSNPFilter());
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
          {actionLabel} <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {/if}
  </div>
</Content>
