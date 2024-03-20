<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import OptionsSelectionList from '../OptionsSelectionList.svelte';
  import FilterStore from '$lib/stores/Filter';
  import SearchStore from '$lib/stores/Search';
  import { getModalStore } from '@skeletonlabs/skeleton';
  let { addFilter } = FilterStore;
  let { activeRow } = SearchStore;
  import { onMount } from 'svelte';
  import type { Filter } from '$lib/models/Filter';
  import {
    createCategoricalFilter,
    createNumericFilter,
    createRequiredFilter,
  } from '$lib/models/Filter';

  const modalStore = getModalStore();

  export let data: SearchResult = {} as SearchResult;

  let allOptions: string[] = [];
  let max: string;
  let min: string;
  let pageSize = 20;
  let options: string[] = [];
  let selectedOptions: string[] = [];
  let startLoacation = 20;

  onMount(async () => {
    if ($modalStore[0]?.meta.existingFilter) {
      const existingFilter: Filter = $modalStore[0]?.meta.existingFilter;
      data.description = existingFilter.description || '';
      data.name = existingFilter.variableName || '';
      data.id = existingFilter.id || '';
      data.searchResult = existingFilter.searchResult || {};
      if (existingFilter.filterType === 'categorical') {
        if (existingFilter.categoryValues.length === 0) {
          selectedOptions = data?.searchResult?.categoryValues || [];
        } else {
          selectedOptions = existingFilter.categoryValues;
        }
        data.isCategorical = true;
        data.categoryValues = existingFilter?.searchResult?.categoryValues || [];
        options =
          data?.categoryValues?.filter((value) => {
            return !selectedOptions.find((selected) => selected === value);
          }) || [];
        allOptions = data?.categoryValues || [];
      } else if (existingFilter.filterType === 'numeric') {
        min = existingFilter.min || '';
        max = existingFilter.max || '';
      }
    } else if (data.isCategorical) {
      options = data?.categoryValues || [];
      allOptions = options;
      if (options.length >= 50) {
        options = options.slice(0, pageSize);
      }
    } else {
      min = data.min !== undefined && data.min >= 0 ? data.min.toString() : '';
      max = data.max !== undefined && data.max >= 0 ? data.max.toString() : '';
    }
  });

  function addNewFilter() {
    let filter: Filter;
    if (data.isCategorical) {
      if (!valuesSelected || valuesSelected.length === 0) return;
      if (valuesSelected.length === data?.categoryValues?.length) {
        filter = createRequiredFilter(data);
      } else {
        filter = createCategoricalFilter(data, valuesSelected);
      }
    } else {
      filter = createNumericFilter(data, min || undefined, max || undefined);
    }
    if (!filter) return; //todo errors
    addFilter(filter);
    finish();
  }

  function finish() {
    $activeRow = -1;
    if ($modalStore[0]) {
      modalStore.close();
    }
  }

  function getNextValues(searchTerm: string) {
    const totalOptions = data?.categoryValues?.length || 0;
    if (totalOptions === 0) return Promise.resolve([]);

    let end = startLoacation + pageSize;
    if (end > totalOptions) {
      end = totalOptions;
    }

    return new Promise<string[]>((resolve) => {
      let nextOptions: string[] = [];
      if (searchTerm) {
        let searchResults = data?.categoryValues?.filter((value) => {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        });
        nextOptions = searchResults?.slice(startLoacation, end) || [];
        startLoacation = end;
      } else {
        nextOptions = data?.categoryValues?.slice(startLoacation, end) || [];
        startLoacation = end;
      }
      resolve(nextOptions);
    });
  }

  $: valuesSelected = selectedOptions.map((option) => option);
</script>

<div class="flex justify-between" data-testid="filter-component">
  {#if data.isCategorical}
    <div data-testid="categoical-filter" class="w-full">
      <OptionsSelectionList {options} {allOptions} bind:selectedOptions loadMore={getNextValues} />
    </div>
  {:else}
    <div class="flex flex-col" data-testid="numerical-filter">
      <label for="min">Min:</label><input
        id="min"
        data-testid="min-input"
        type="text"
        placeholder={min}
        bind:value={min}
      />
      <label for="min">Max:</label><input
        id="max"
        data-testid="max-input"
        type="text"
        placeholder={max}
        bind:value={max}
      />
    </div>
  {/if}
  <button
    class="btn btn-icon variant-filled-primary m-1"
    data-testid="add-filter"
    on:click={addNewFilter}
    disabled={data.isCategorical && valuesSelected.length === 0}
  >
    <i class="fas fa-plus"></i>
  </button>
</div>

<style>
  .btn {
    height: fit-content;
  }
</style>
