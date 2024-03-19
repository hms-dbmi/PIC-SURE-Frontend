<script lang="ts">
  import { Accordion, AccordionItem, ProgressBar } from '@skeletonlabs/skeleton';
  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import Content from '$lib/components/Content.svelte';
  import Checkbox from '$lib/components/explorer/Checkbox.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import FilterStore from '$lib/stores/Search';
  let { tags, searchTerm, searchResults, search } = FilterStore;

  let searchInput = $page.url.searchParams.get('search') || $searchTerm || '';
  let searchPromise: Promise<void> = search(searchInput);

  const columns = [
    { dataElement: 'name', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'id', label: 'Actions', class: 'w-36' },
  ];

  const cellOverides = {
    id: Actions,
  };

  function updateSearch() {
    goto(searchInput ? `/explorer?search=${searchInput}` : '/explorer', { replaceState: true });
    searchPromise = search(searchInput);
  }
</script>

<Content full>
  {#await searchPromise}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <div class="grid grid-cols-4 gap-6">
      <div id="search-tags">
        {#if $tags.length > 0}
          <Accordion autocollapse>
            {#each $tags as tagType, index}
              <AccordionItem open={index === 0}>
                <svelte:fragment slot="summary">{tagType.title}</svelte:fragment>
                <svelte:fragment slot="content">
                  {#each tagType.tags as tag}
                    <Checkbox type={tagType.title} tag={tag.name} state={tag.state} />
                  {/each}
                </svelte:fragment>
              </AccordionItem>
            {/each}
          </Accordion>
        {:else}
          <p>No Tags to display.</p>
        {/if}
      </div>
      <div class="col-span-3">
        <div id="search-bar" class="flex gap-4 mb-6">
          <div class="flex-auto">
            <input
              class="input"
              type="text"
              placeholder="search..."
              aria-label="Type search terms here, use enter or the search button to submit search"
              bind:value={searchInput}
              on:keydown={(e) => e.key === 'Enter' && updateSearch()}
            />
          </div>
          <div class="flex-none">
            <button
              type="button"
              class="btn variant-ghost-primary hover:variant-filled-primary"
              aria-label="You are on the search button"
              disabled={!searchInput}
              on:click={updateSearch}
            >
              Search
            </button>
          </div>
          <div class="flex-none">
            <button
              type="button"
              class="btn variant-ghost-error hover:variant-filled-error"
              aria-label="You are on the reset button"
              disabled={!searchInput}
              on:click={() => {
                searchInput = '';
                updateSearch();
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <Datatable data={$searchResults} {columns} {cellOverides} />
      </div>
    </div>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
