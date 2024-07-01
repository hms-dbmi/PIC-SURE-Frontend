<script lang="ts">
  import { Accordion, AccordionItem, ProgressRadial } from '@skeletonlabs/skeleton';
  import SearchStore from '$lib/stores/Search';
  import { updateFacetsFromSearch } from '$lib/services/dictionary';
  import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
  import { browser } from '$app/environment';
  import ErrorAlert from '../ErrorAlert.svelte';
  import type { Facet } from '$lib/models/Search';
  let { updateFacet, searchTerm, selectedFacets } = SearchStore;

  let facetsPromise: Promise<DictionaryFacetResult[]>;
  if (browser) {
    searchTerm.subscribe(() => {
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
    selectedFacets.subscribe(() => {
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
  }
  $: isChecked = (facetToCheck: string) =>
    $selectedFacets.some((facet: Facet) => {
      return facet.name === facetToCheck;
    });
</script>

<div id="facet-side-bar">
  {#await facetsPromise}
    <ProgressRadial />
  {:then newFacets}
    {#if newFacets?.length > 0}
      <Accordion autocollapse>
        {#each newFacets as facetCategroy, index}
          <AccordionItem open={index === 0}>
            <svelte:fragment slot="summary">{facetCategroy.display}</svelte:fragment>
            <svelte:fragment slot="content">
              <div class="flex flex-col">
                {#each facetCategroy.facets as tag}
                  <label for={tag.name} class="m-1">
                    <input
                      type="checkbox"
                      id={tag.name}
                      name={tag.name}
                      value={tag}
                      checked={isChecked(tag.name)}
                      on:click={() => updateFacet(tag)}
                    />
                    <span>{`${tag.display} (${tag.count})`}</span>
                  </label>
                {/each}
              </div>
            </svelte:fragment>
          </AccordionItem>
        {/each}
      </Accordion>
    {:else}
      <p>No Tags to display.</p>
    {/if}
  {:catch}
    <ErrorAlert title="An error occured while retrieving facets." />
  {/await}
</div>

<style>
</style>
