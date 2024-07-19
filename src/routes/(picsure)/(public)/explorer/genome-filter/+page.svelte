<script lang="ts">
  import { onMount } from 'svelte';
  import { branding } from '$lib/configuration';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import Content from '$lib/components/Content.svelte';
  import FilterType from '$lib/components/explorer/gemone-filter/FilterType.svelte';
  import SnpSearch from '$lib/components/explorer/gemone-filter/SNPSearch.svelte';
  import GeneSearch from '$lib/components/explorer/gemone-filter/GeneSearch.svelte';
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  import { Option } from '$lib/models/GemoneFilter';
  import {
    selectedGenes,
    selectedFrequency,
    consequences,
    clearGeneFilters,
    generateGenomicFilter,
  } from '$lib/stores/GeneFilter';
  import { selectedSNPs, generateSNPFilter, clearSnpFilters } from '$lib/stores/SNPFilter';
  import { addFilter } from '$lib/stores/Filter';
  import { error as infoColumnError, loadInfoColumns } from '$lib/stores/InfoColumns';

  let edit = $page.url.searchParams.get('edit') || '';
  let selectedOption: Option = ['snp', 'genomic'].includes(edit) ? (edit as Option) : Option.None;

  function clearFilters() {
    clearGeneFilters();
    clearSnpFilters();
  }

  function onComplete() {
    const filter =
      selectedOption === Option.Genomic ? generateGenomicFilter() : generateSNPFilter();
    addFilter(filter);
    clearFilters();
    goto('/explorer');
  }

  onMount(async () => {
    await loadInfoColumns();
    if ($infoColumnError) {
      toastStore.trigger({
        message: $infoColumnError,
        background: 'variant-filled-error',
      });
    }
  });

  $: canComplete =
    (selectedOption === Option.Genomic &&
      ($selectedGenes.length > 0 || $selectedFrequency.length > 0 || $consequences.length > 0)) ||
    (selectedOption === Option.SNP && $selectedSNPs.length > 0);
</script>

<svelte:head>
  <title>{branding.applicationName} | Gemonic Filter</title>
</svelte:head>

<Content
  full={true}
  title="Genomic Filtering"
  backUrl="/explorer"
  backAction={clearFilters}
  backTitle="Back to Explore"
>
  {#if selectedOption === Option.None}
    <FilterType
      class="my-4"
      on:select={(event) => {
        selectedOption = event.detail.option;
      }}
    />
  {:else}
    {#if selectedOption === Option.Genomic}
      <h2 class="mb-2">Search by Gene:</h2>
      <GeneSearch class="mb-0" />
    {:else}
      <h2 class="mb-2">Search by SNP:</h2>
      <SnpSearch />
    {/if}
    {#if edit}
      <div class="flex justify-end my-4">
        <button
          data-testid="save-filter-btn"
          type="button"
          class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75"
          on:click={onComplete}
          disabled={!canComplete}
        >
          Save Filter <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {:else}
      <div class="flex justify-between my-4">
        <AngleButton data-testid="back-btn" on:click={() => (selectedOption = Option.None)}
          >Back
        </AngleButton>
        <button
          data-testid="add-filter-btn"
          type="button"
          class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75"
          on:click={onComplete}
          disabled={!canComplete}
        >
          Add Filter <i class="fa-solid fa-plus ml-3"></i>
        </button>
      </div>
    {/if}
  {/if}
</Content>
