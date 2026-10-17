<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { config } from '#lib/config/config.svelte.ts';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import Content from '#lib/shell/Content.svelte';
  import FilterType from '#lib/explorer/genomic/FilterType.svelte';
  import SnpSearch from '#lib/explorer/genomic/SNPSearch.svelte';
  import GeneSearch from '#lib/explorer/genomic/GeneSearch.svelte';

  import type { GenomicFilterInterface, SnpFilterInterface } from '#lib/query/filter.svelte.ts';
  import { Option } from '#lib/query/genomic.ts';
  import {
    selectedGenes,
    clearGeneFilters,
    generateGenomicFilter,
    populateFromGeneFilter,
  } from '#lib/query/GeneFilter.ts';
  import {
    selectedSNPs,
    generateSNPFilter,
    clearSnpFilters,
    populateFromSNPFilter,
  } from '#lib/query/SNPFilter.ts';
  import { addFilter, getFiltersByType } from '#lib/query/filters.ts';
  import { panelOpen } from '#lib/explorer/panel.ts';

  let edit = page.url.searchParams.get('edit') || '';
  let selectedOption: Option = $state(
    (() => {
      if (config.features.enableGENEQuery && !config.features.enableSNPQuery) return Option.Genomic;
      if (!config.features.enableGENEQuery && config.features.enableSNPQuery) return Option.SNP;
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
    goto(resolve('explorer'));
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
  <title>{config.branding.applicationName} | Genomic Filter</title>
</svelte:head>

<Content
  full
  title="Genomic Filtering"
  backUrl="/explorer"
  backAction={clearFilters}
  backTitle="Back to Explore"
  transition
>
  {#if config.features.enableGENEQuery && config.features.enableSNPQuery}
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
          data-testid="genomic-filter-save"
          type="button"
          class="btn btn-sm preset-filled-primary-500 disabled:opacity-75"
          onclick={onComplete}
          disabled={!canComplete}
        >
          Save Filter <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {:else}
      <div class="flex justify-end my-4" data-testid="genomic-filter-options">
        <button
          data-testid="genomic-filter-add"
          type="button"
          class="btn btn-sm preset-filled-primary-500 disabled:opacity-75"
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
