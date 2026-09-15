<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import * as api from '$lib/api';
  import { toaster } from '$lib/toaster';
  import { Picsure } from '$lib/paths';
  import { geneDraftRevision, geneOptions, selectedGenes } from '$lib/stores/GeneFilter';

  import OptionsSelectionList from '$lib/components/OptionsSelectionList.svelte';
  import { log, createLog } from '$lib/logger';

  /**
   * The genes the draft held when it was last replaced from outside these panels, kept so that
   * unselecting one puts it back in the options list: the page of the values endpoint this
   * loaded need not contain a gene that came from the applied filter, and a gene that is in
   * neither list has vanished.
   *
   * Re-read on every such replacement rather than at mount alone, because the filter can be
   * loaded into a tab that is already on screen - which is what the edit control on a filter's
   * chip does, the Genotypes tab being the route it leads to. Untracked, so ordinary selecting
   * and unselecting leaves it alone; the options list maintains itself for those.
   */
  let genesFromSavedFilter: string[] = $state([]);
  $effect.pre(() => {
    void $geneDraftRevision;
    genesFromSavedFilter = [...get(selectedGenes)];
  });
  let unselectedGenes = $derived(
    [...new Set([...genesFromSavedFilter, ...$geneOptions.options])].filter(
      (gene) => !$selectedGenes.includes(gene),
    ),
  );

  // Seeds the box from whatever the loaded options answer to, so a restored list and the
  // search above it say the same thing. Two-way after that: the list owns the typing.
  let search = $state(get(geneOptions).search);

  const pageSize = 20;
  let loading = $state(false);

  let previousGeneCount = 0;

  // given a search term, return new values to be added to displayed options
  async function getGeneValues(term: string = '') {
    const loaded = get(geneOptions);
    const newSearch = loaded.search !== term;
    if (newSearch && term) {
      log(createLog('ACTION', 'genomic.gene_search', { term }));
    }
    if (!newSearch && (loaded.page >= loaded.totalPages || loaded.allLoaded)) return;
    loading = true;
    try {
      const response = await api.get(
        `${Picsure.SearchValues}?` +
          new URLSearchParams({
            genomicConceptPath: 'Gene_with_variant',
            query: term,
            page: (newSearch ? 1 : loaded.page + 1).toString(),
            size: pageSize.toString(),
          }),
        { 'content-type': 'application/json' },
      );

      if (response?.error) {
        throw response.error;
      }

      const newGenes = response.results;
      geneOptions.set({
        options: newSearch ? newGenes : [...loaded.options, ...newGenes],
        search: term,
        page: response.page,
        totalPages: Math.ceil(response.total / pageSize),
        // Check if we've loaded all options
        allLoaded: newGenes.length < pageSize,
        loaded: true,
      });
    } catch (error) {
      console.error(error);
      toaster.error({ title: 'An error occurred while loading genes list.' });
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    previousGeneCount = $selectedGenes.length;
    // Only a first mount loads. A remount - which every search-mode switch causes - already
    // has the options and the scroll position it left behind.
    if (!get(geneOptions).loaded) await getGeneValues();
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
    bind:searchInput={search}
    bind:unselectedOptions={unselectedGenes}
    bind:selectedOptions={$selectedGenes}
    bind:currentlyLoading={loading}
    allOptionsLoaded={$geneOptions.allLoaded}
    onscroll={getGeneValues}
  />
</div>
