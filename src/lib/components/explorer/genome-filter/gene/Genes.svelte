<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '$lib/api';
  import { toaster } from '$lib/toaster';
  import { Picsure } from '$lib/paths';
  import { selectedGenes } from '$lib/stores/GeneFilter';

  import OptionsSelectionList from '$lib/components/OptionsSelectionList.svelte';
  import { log, createLog } from '$lib/logger';

  let allGenes: string[] = $state([]);
  // Genes restored from a saved filter are not guaranteed to be in any page of search
  // results. Keeping them here means unchecking one returns it to the options list for
  // good, instead of showing it until the next selection change recomputes the list.
  let genesFromSavedFilter: string[] = $state([]);
  let unselectedGenes = $derived(
    [...new Set([...genesFromSavedFilter, ...allGenes])].filter(
      (gene) => !$selectedGenes.includes(gene),
    ),
  );

  let lastFilter = '';
  let pageSize = 20;
  let currentPage = 0;
  let totalPages = 1;
  let loading = $state(false);
  let allOptionsLoaded = $state(false);

  let previousGeneCount = 0;

  // given a search term, return new values to be added to displayed options
  async function getGeneValues(search: string = '') {
    const newSearch = lastFilter !== search;
    if (newSearch && search) {
      log(createLog('ACTION', 'genomic.gene_search', { term: search }));
    }
    if (!newSearch && (currentPage >= totalPages || allOptionsLoaded)) return;
    loading = true;
    try {
      const response = await api.get(
        `${Picsure.SearchValues}?` +
          new URLSearchParams({
            genomicConceptPath: 'Gene_with_variant',
            query: search,
            page: (newSearch ? 1 : currentPage + 1).toString(),
            size: pageSize.toString(),
          }),
        { 'content-type': 'application/json' },
      );

      if (response?.error) {
        throw response.error;
      }

      const newGenes = response.results;
      allGenes = newSearch ? newGenes : [...allGenes, ...newGenes];
      totalPages = Math.ceil(response.total / pageSize);
      currentPage = response.page;
      lastFilter = search;

      // Check if we've loaded all options
      allOptionsLoaded = newGenes.length < pageSize;
    } catch (error) {
      console.error(error);
      toaster.error({ title: 'An error occurred while loading genes list.' });
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    previousGeneCount = $selectedGenes.length;
    genesFromSavedFilter = [...$selectedGenes];
    await getGeneValues();
  });

  $effect(() => {
    const current = $selectedGenes;
    if (current.length > previousGeneCount) {
      const added = current[current.length - 1];
      log(createLog('ACTION', 'genomic.gene_add', { gene: added }));
    }
    previousGeneCount = current.length;
  });
</script>

<div class="flex gap-4 mb-2">
  <OptionsSelectionList
    showSelectAll={false}
    showClearAll={false}
    bind:unselectedOptions={unselectedGenes}
    bind:selectedOptions={$selectedGenes}
    bind:currentlyLoading={loading}
    {allOptionsLoaded}
    onscroll={getGeneValues}
  />
</div>
