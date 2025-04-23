<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '$lib/api';
  import { resources } from '$lib/configuration';
  import { selectedGenes } from '$lib/stores/GeneFilter';

  import OptionsSelectionList from '$lib/components/OptionsSelectionList.svelte';

  const toastStore = getToastStore();

  let allGenes: string[] = $state([]);
  let unselectedGenes = $derived(
    $selectedGenes.length === 0
      ? allGenes
      : allGenes.filter((gene) => !$selectedGenes.includes(gene)),
  );

  let lastFilter = '';
  let pageSize = 20;
  let currentPage = 0;
  let totalPages = 1;
  let loading = $state(false);
  let allOptionsLoaded = $state(false);

  // given a search term, return new values to be added to displayed options
  async function getGeneValues(search: string = '') {
    const newSearch = lastFilter !== search;
    if (!newSearch && (currentPage >= totalPages || allOptionsLoaded)) return;
    loading = true;
    try {
      const response = await api.get(
        `picsure/search/${resources.hpds}/values/?` +
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
      toastStore.trigger({
        message: 'An error occurred while loading genes list.',
        background: 'preset-filled-error-500',
      });
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await getGeneValues();
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
