<script lang="ts">
  import FacetPlaceholder from './FacetPlaceholder.svelte';
  import type { PreviousCategoriesForPlaceholder } from '$lib/models/Search';

  let {
    fadeEffect = false,
    numCategories = 2,
    previousCategories = [] as PreviousCategoriesForPlaceholder[],
  } = $props();

  const smartMode = previousCategories?.length > 0;
  const numberOfCategories = smartMode ? previousCategories?.length || 1 : numCategories;
  const fadeLastCategory = smartMode ? false : fadeEffect;
  const numFacets = 1 + numberOfCategories;
</script>

<div class="flex flex-col gap-4">
  {#if smartMode}
    {#each previousCategories as category, i}
      <FacetPlaceholder
        numFacets={category?.numFacets || 5}
        fadeEffect={fadeLastCategory && i === previousCategories.length - 1}
      />
    {/each}
  {:else}
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each Array(numberOfCategories) as _unused, i}
      <FacetPlaceholder
        numFacets={numFacets - i > 1 ? numFacets - i : 2}
        fadeEffect={fadeLastCategory && i === numberOfCategories - 1}
      />
    {/each}
  {/if}
</div>
