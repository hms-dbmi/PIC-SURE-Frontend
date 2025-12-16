<script lang="ts">
  import type { Filter } from '$lib/models/Filter.svelte';
  import { populateFromGeneFilter } from '$lib/stores/GeneFilter';
  import { populateFromSNPFilter } from '$lib/stores/SNPFilter';
  import { activeFilter, activeSearch, removeFilter } from '$lib/stores/Filter';
  import { goto } from '$app/navigation';
  import { Option } from '$lib/models/GenomeFilter';
  import Modal from '$lib/components/Modal.svelte';
  import AddFilter from '$lib/components/explorer/AddFilter.svelte';

  let { filter }: { filter: Filter } = $props();

  const genomicFilter = $derived(['genomic', 'snp'].includes(filter.filterType));
  const anyRecordOfFilter = $derived(filter.filterType === 'AnyRecordOf');
  let filterModal: boolean = $state(false);

  function editFilter() {
    if (filter.filterType === 'genomic') {
      populateFromGeneFilter(filter);
      goto('/explorer/genome-filter?edit=' + Option.Genomic);
    } else if (filter.filterType === 'snp') {
      populateFromSNPFilter(filter);
      goto('/explorer/genome-filter?edit=' + Option.SNP);
    } else {
      $activeFilter = filter;
      $activeSearch = filter.searchResult;
    }
  }

  const deleteFilter = function () {
    return removeFilter(filter.uuid);
  };
</script>


<div class="actions">
  {#if genomicFilter}
    <button
      type="button"
      title="Edit Filter"
      class="bg-initial text-black-500 hover:text-primary-600"
      onclick={editFilter}
    >
      <i class="fa-solid fa-pen-to-square"></i>
      <span class="sr-only">Edit Filter</span>
    </button>
  {:else if !anyRecordOfFilter}
    <Modal
      bind:open={filterModal}
      title="Edit Filter"
      triggerBase="bg-initial text-black-500 hover:text-primary-600"
      withDefault={false}
    >
      {#snippet trigger()}
        <i class="fa-solid fa-pen-to-square"></i>
        <span class="sr-only">Edit Filter</span>
      {/snippet}
      <AddFilter
        data={filter.searchResult}
        existingFilter={filter}
        onclose={() => (filterModal = false)}
      />
    </Modal>
  {/if}
  <button
    type="button"
    title="Remove Filter"
    class="bg-initial text-black-500 hover:text-primary-600"
    onclick={deleteFilter}
  >
    <i class="fa-solid fa-times-circle"></i>
    <span class="sr-only">Remove Filter</span>
  </button>
</div>