<script lang="ts">
  import { onMount } from 'svelte';
  import { toaster } from '#lib/ui/toaster.ts';
  import { searchGenes } from '#lib/api/picsure/dictionary.ts';
  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';

  import OptionsSelectionList from '#lib/ui/OptionsSelectionList.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let allGenes: string[] = $state([]);
  let genesFromSavedFilter: string[] = $state([]);
  let unselectedGenes = $derived(
    [...new Set([...genesFromSavedFilter, ...allGenes])].filter(
      (gene) => !genomicDraft.genes.includes(gene),
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
      const response = await searchGenes(search, newSearch ? 1 : currentPage + 1, pageSize);
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
    previousGeneCount = genomicDraft.genes.length;
    genesFromSavedFilter = [...genomicDraft.genes];
    await getGeneValues();
  });

  $effect(() => {
    const current = genomicDraft.genes;
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
    bind:selectedOptions={genomicDraft.genes}
    bind:currentlyLoading={loading}
    {allOptionsLoaded}
    onscroll={getGeneValues}
  />
</div>
