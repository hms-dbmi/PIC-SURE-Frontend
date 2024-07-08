<script lang="ts">
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { AccordionItem } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import type { Facet } from '$lib/models/Search';
  let { updateFacet, selectedFacets } = SearchStore;

  export let facetCategory: DictionaryFacetResult;
  export let index: number;

  $: isChecked = (facetToCheck: string) =>
    $selectedFacets.some((facet: Facet) => {
      return facet.name === facetToCheck;
    });
</script>

<AccordionItem class="card" open={index === 0}>
  <svelte:fragment slot="summary">{facetCategory.display}</svelte:fragment>
  <svelte:fragment slot="content">
    <div class="flex flex-col">
      {#each facetCategory.facets as facet}
        <label for={facet.name} class="m-1">
          <input
            type="checkbox"
            id={facet.name}
            name={facet.name}
            value={facet}
            checked={isChecked(facet.name)}
            on:click={() => updateFacet(facet, facetCategory)}
          />
          <span>{`${facet.display} (${facet.count})`}</span>
        </label>
      {/each}
    </div>
  </svelte:fragment>
</AccordionItem>
