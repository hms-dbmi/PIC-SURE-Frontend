<script lang="ts">
  import { Accordion, AccordionItem, ProgressRadial } from '@skeletonlabs/skeleton';
  import Checkbox from '$lib/components/explorer/Checkbox.svelte';
  import SearchStore from '$lib/stores/Search';
  import { updateFacetsFromSearch } from '$lib/services/dictionary';
    import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
    import { browser } from '$app/environment';
    import ErrorAlert from '../ErrorAlert.svelte';
  let { searchTerm, selectedFacets } = SearchStore;

  let facetsPromise: Promise<DictionaryFacetResult[]>;
  if (browser) {
    searchTerm.subscribe(() => {
      console.log('searchTerm changed, now getting facets with: ', $searchTerm, $selectedFacets);
      facetsPromise = updateFacetsFromSearch($searchTerm, $selectedFacets);
    });
  }

</script>

<div id="facet-side-bar">
  {#await facetsPromise }
    <ProgressRadial />
  {:then facets}
    {#if facets.length > 0}
    <Accordion autocollapse>
      {#each facets as facetCategroy, index}
        <AccordionItem open={index === 0}>
          <svelte:fragment slot="summary">{facetCategroy.display}</svelte:fragment>
          <svelte:fragment slot="content">
            {#each facetCategroy.facets ?? [] as tag}
              <Checkbox type={facetCategroy.name} tag={tag.display} state={tag.state} />
            {/each}
          </svelte:fragment>
        </AccordionItem>
      {/each}
    </Accordion>
    {:else}
      <p>No Tags to display.</p>
    {/if}
  {:catch error}
    <ErrorAlert title="An error occured while retrieving facets." />
  {/await}
</div>

<style>

</style>