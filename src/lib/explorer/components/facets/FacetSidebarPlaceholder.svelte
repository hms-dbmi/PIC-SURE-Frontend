<script lang="ts">
  import FacetPlaceholder from './FacetPlaceholder.svelte';

  interface Props {
    fadeEffect?: boolean;
    numCategories?: number;
  }

  let { fadeEffect = false, numCategories = 2 }: Props = $props();

  const numFacets = $derived(1 + numCategories);
</script>

<div class="flex flex-col gap-4">
  {#each { length: numCategories }, i}
    <FacetPlaceholder
      numFacets={numFacets - i > 1 ? numFacets - i : 2}
      fadeEffect={fadeEffect && i === numCategories - 1}
    />
  {/each}
</div>
