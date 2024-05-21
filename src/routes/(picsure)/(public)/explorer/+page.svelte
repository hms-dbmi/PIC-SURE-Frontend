<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { Accordion, AccordionItem, ProgressBar } from '@skeletonlabs/skeleton';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import Content from '$lib/components/Content.svelte';
  import Checkbox from '$lib/components/explorer/Checkbox.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import AddFilterComponent from '$lib/components/explorer/AddFilter.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';

  import { branding, features } from '$lib/configuration';
  import SearchStore from '$lib/stores/Search';
  import { activeRow, activeComponent, expandableComponents } from '$lib/stores/ExpandableRow';
  import Searchbox from '$lib/components/Searchbox.svelte';
  let { tags, searchTerm, searchResults, search } = SearchStore;

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

  // TODO: Bug? Why not typeof SvelteComponent?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expandableComponentRegistry: Record<string, new (...args: any[]) => SvelteComponent> = {
    filter: AddFilterComponent,
    info: ResultInfoComponent,
    hierarchy: HierarchyComponent,
  };

  let rowClickHandler = (index: number) => {
    if ($activeRow === index) {
      activeRow.set(-1);
      return;
    }
    activeRow.set(index);
    activeComponent.set($expandableComponents['info']);
  };

  expandableComponents.set(expandableComponentRegistry);

  function updateSearch() {
    goto(searchInput ? `/explorer?search=${searchInput}` : '/explorer', { replaceState: true });
    searchPromise = search(searchInput);
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>
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
        <div id="search-bar" class="flex gap-2 mb-6">
          <div class="flex-auto">
            <Searchbox bind:searchTerm={searchInput} search={updateSearch} />
          </div>
          <div class="flex-none">
            {#if features.genomicFilter}
              <a
                class="btn variant-ghost-primary hover:variant-filled-primary"
                href="/explorer/genome-filter">Genomic Filtering</a
              >
            {/if}
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
        <Datatable data={$searchResults} {columns} {cellOverides} {rowClickHandler} />
      </div>
    </div>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
