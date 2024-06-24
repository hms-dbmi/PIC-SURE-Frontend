<script lang="ts">
  import { onMount } from 'svelte';
  import { getToastStore } from '@skeletonlabs/skeleton';

  import * as api from '$lib/api';
  import { resources } from '$lib/configuration';
  import OptionsSelectionList from '$lib/components/OptionsSelectionList.svelte';

  import GeneFilterStore from '$lib/stores/GenomicFilter';
  let { selectedGenes } = GeneFilterStore;

  const toastStore = getToastStore();

  let allGenes: string[] = [];
  $: unselectedGenes =
    $selectedGenes.length === 0
      ? allGenes
      : allGenes.filter((gene) => !$selectedGenes.includes(gene));

  let lastFilter = '';
  let pageSize = 50;
  let currentPage = 0;
  let totalPages = 1;
  let loading = false;

  // given a search term, return new values to be added to displayed options
  async function getGeneValues(search: string = '') {
    const newSearch = lastFilter !== search;

    if (!newSearch && currentPage >= totalPages) return;

    loading = true;
    await api
      .get(
        `picsure/search/${resources.hpds}/values/?` +
          new URLSearchParams({
            genomicConceptPath: 'Gene_with_variant',
            query: search,
            page: (newSearch ? 1 : currentPage + 1).toString(),
            size: pageSize.toString(),
          }),
        { 'content-type': 'application/json' },
      )
      .then((response) => {
        if (response?.error) {
          return Promise.reject(response.error);
        }
        return response;
      })
      .then((response) => {
        allGenes = newSearch ? response.results : [...allGenes, ...response.results];
        totalPages = Math.ceil(response.total / pageSize);
        currentPage = response.page;
        lastFilter = search;
      })
      .catch((error) => {
        console.error(error);
        toastStore.trigger({
          message: 'An error occured while loading genes list.',
          background: 'variant-filled-error',
        });
      });
    loading = false;
  }

  onMount(async () => {
    await getGeneValues();
  });
</script>

<div class="flex gap-4">
  <OptionsSelectionList
    showSelectAll={false}
    showClearAll={false}
    bind:unselectedOptions={unselectedGenes}
    bind:selectedOptions={$selectedGenes}
    bind:currentlyLoading={loading}
    on:scroll={(event) => getGeneValues(event.detail.search)}
  />
</div>
