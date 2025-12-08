<script lang="ts">
  import { onMount } from 'svelte';

  import { branding, features } from '$lib/configuration';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import Content from '$lib/components/Content.svelte';
  import FilterType from '$lib/components/explorer/genome-filter/FilterType.svelte';
  import SnpSearch from '$lib/components/explorer/genome-filter/SNPSearch.svelte';
  import GeneSearch from '$lib/components/explorer/genome-filter/GeneSearch.svelte';

  import type { GenomicFilterInterface, SnpFilterInterface } from '$lib/models/Filter';
  import { Option } from '$lib/models/GenomeFilter';
  import {
    selectedGenes,
    clearGeneFilters,
    generateGenomicFilter,
    populateFromGeneFilter,
  } from '$lib/stores/GeneFilter';
  import {
    selectedSNPs,
    generateSNPFilter,
    clearSnpFilters,
    populateFromSNPFilter,
  } from '$lib/stores/SNPFilter';
  import { addFilter, getFiltersByType } from '$lib/stores/Filter';
  import { panelOpen } from '$lib/stores/SidePanel';

  let edit = page.url.searchParams.get('edit') || '';
  let selectedOption: Option = $state(
    (() => {
      if (features.enableGENEQuery && !features.enableSNPQuery) return Option.Genomic;
      if (!features.enableGENEQuery && features.enableSNPQuery) return Option.SNP;
      return ['snp', 'genomic'].includes(edit) ? (edit as Option) : Option.None;
    })(),
  );

  function clearFilters() {
    clearGeneFilters();
    clearSnpFilters();
  }

  function onComplete() {
    const filter =
      selectedOption === Option.Genomic ? generateGenomicFilter() : generateSNPFilter();
    addFilter(filter);
    clearFilters();
    $panelOpen = true;
    goto('/explorer');
  }

  function populateExistingFilters() {
    if (selectedOption === Option.Genomic) {
      const filters = getFiltersByType('genomic') as GenomicFilterInterface[];
      filters.length === 1 && populateFromGeneFilter(filters[0]);
    } else if (selectedOption === Option.SNP) {
      const filters = getFiltersByType('snp') as SnpFilterInterface[];
      filters.length === 1 && populateFromSNPFilter(filters[0]);
    }
  }

  onMount(populateExistingFilters);

  function onSelectFilterType(option: Option) {
    selectedOption = option;
    populateExistingFilters();
  }

  let canComplete = $derived(
    (selectedOption === Option.Genomic && $selectedGenes.length > 0) ||
      (selectedOption === Option.SNP && $selectedSNPs.length > 0),
  );
</script>

<svelte:head>
  <title>{branding.applicationName} | Gemonic Filter</title>
</svelte:head>

<Content
  full
  title="Genomic Filtering"
  backUrl="/explorer"
  backAction={clearFilters}
  backTitle="Back to Explore"
  transition
>
  {#if features.enableGENEQuery && features.enableSNPQuery}
    <FilterType class="my-4" onselect={onSelectFilterType} active={selectedOption} />
  {/if}
  {#if selectedOption !== Option.None}
    {#if selectedOption === Option.Genomic}
      <GeneSearch class="mb-0 mt-6" />
    {:else}
      <SnpSearch class="mt-6" />
    {/if}
    {#if edit}
      <div class="flex justify-end my-4">
        <button
          data-testid="save-filter-btn"
          type="button"
          class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"
          onclick={onComplete}
          disabled={!canComplete}
        >
          Save Filter <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {:else}
      <div class="flex justify-end my-4" data-testid="filter-options-container">
        <button
          data-testid="add-filter-btn"
          type="button"
          class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"
          title={canComplete
            ? 'Add Filter'
            : selectedOption === Option.Genomic
              ? 'A gene is required'
              : 'A SNP is required'}
          onclick={onComplete}
          disabled={!canComplete}
        >
          Add Filter <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {/if}
  {/if}
</Content>
