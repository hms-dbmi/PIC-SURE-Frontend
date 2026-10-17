<script lang="ts">
  import FacetPlaceholder from './FacetPlaceholder.svelte';
  import type { PreviousCategoriesForPlaceholder } from '#lib/explorer/types.ts';

  interface Props {
    fadeEffect?: boolean;
    numCategories?: number;
    previousCategories?: PreviousCategoriesForPlaceholder[];
  }

  let { fadeEffect = false, numCategories = 2, previousCategories = [] }: Props = $props();

  const smartMode = $derived(previousCategories.length > 0);
  const fadeLastCategory = $derived(smartMode ? false : fadeEffect);
  const numFacets = $derived(1 + numCategories);
</script>

<div class="flex flex-col gap-4">
  {#if smartMode}
    {#each previousCategories as category}
      <FacetPlaceholder numFacets={category?.numFacets || 5} />
    {/each}
  {:else}
    {#each { length: numCategories }, i}
      <FacetPlaceholder
        numFacets={numFacets - i > 1 ? numFacets - i : 2}
        fadeEffect={fadeLastCategory && i === numCategories - 1}
      />
    {/each}
  {/if}
</div>
