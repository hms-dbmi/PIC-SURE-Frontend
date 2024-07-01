<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import OptionsSelectionList from '../OptionsSelectionList.svelte';
  import FilterStore from '$lib/stores/Filter';
  import { activeRow } from '$lib/stores/ExpandableRow';
  import { ProgressRadial, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  let { addFilter } = FilterStore;
  import { onMount } from 'svelte';
  import type { Filter } from '$lib/models/Filter';
  import {
    createCategoricalFilter,
    createNumericFilter,
    createRequiredFilter,
  } from '$lib/models/Filter';
  import * as api from '$lib/api';

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  export let data: SearchResult;

  let max: string;
  let min: string;
  let pageSize = 20;
  let unselectedOptions: string[] = [];
  let selectedOptions: string[] = [];
  let startLoacation = 20;
  let loading = false;

  onMount(async () => {
    if ($modalStore[0]?.meta.existingFilter) {
      const existingFilter: Filter = $modalStore[0]?.meta.existingFilter;
      data = $modalStore[0]?.meta.existingFilter.searchResult;
      if (existingFilter.filterType === 'Categorical') {
        if (existingFilter.categoryValues.length === 0) {
          selectedOptions = data?.values || [];
        } else {
          selectedOptions = existingFilter.categoryValues;
        }
        unselectedOptions =
          data?.values?.filter((value) => {
            return !selectedOptions.find((selected) => selected === value);
          }) || [];
      } else if (existingFilter.filterType === 'numeric') {
        min = existingFilter.min || '';
        max = existingFilter.max || '';
      }
    } else if (data?.type === 'Categorical') {
      try {
        //todo: move this to some service or something
        //TODO: cache this response
        const response: SearchResult = await api.post(
          `/picsure/proxy/dictionary-api/concepts/detail/${data.dataset}`,
          String.raw`${data.conceptPath.replace(/\\\\/g, '\\')}`,
        );
        // const response = {
        //   type: 'Categorical',
        //   conceptPath: '\\Variant Data Type\\Low coverage WGS\\',
        //   name: 'Low coverage WGS',
        //   display: 'Low coverage WGS',
        //   dataset: '1',
        //   description: 'Low coverage WGS',
        //   values: ['TRUE'],
        //   children: null,
        //   meta: { values: 'TRUE', description: 'Low coverage WGS' },
        // } as SearchResult;
        data = response;
        unselectedOptions = data?.values || [];
        if (unselectedOptions.length >= 50) {
          unselectedOptions = unselectedOptions.slice(0, pageSize);
        }
      } catch (e) {
        console.error(e);
        toastStore.trigger({
          message: 'An error occured while loading the filter. Please try again later.',
          background: 'variant-filled-error',
        });
      }
    } else {
      min = data.min !== undefined && data.min >= 0 ? data.min.toString() : '';
      max = data.max !== undefined && data.max >= 0 ? data.max.toString() : '';
    }
  });

  function addNewFilter() {
    let filter: Filter;
    if (data.type === 'Categorical') {
      if (!valuesSelected || valuesSelected.length === 0) return;
      if (valuesSelected.length === data?.values?.length) {
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
    $activeRow = '';
    if ($modalStore[0]) {
      modalStore.close();
    }
  }

  function getNextValues(search: string = '') {
    const totalOptions = data?.values?.length || 0;
    if (totalOptions === 0) return;

    loading = true;
    try {
      let nextOptions: string[] = [];
      let end = startLoacation + pageSize;
      if (end > totalOptions) {
        end = totalOptions;
      }

      if (search) {
        nextOptions =
          data?.values
            ?.filter((value) => value.toLowerCase().includes(search.toLowerCase()))
            .slice(startLoacation, end) || [];
        startLoacation = end;
      } else {
        nextOptions = data?.values?.slice(startLoacation, end) || [];
        startLoacation = end;
      }

      if (nextOptions && Array.isArray(nextOptions) && nextOptions.length > 0) {
        unselectedOptions = [...unselectedOptions, ...nextOptions];
      }
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: 'An error occured while loading more options. Please try again later.',
        background: 'variant-filled-error',
      });
    }
    loading = false;
  }

  $: valuesSelected = selectedOptions.map((option) => option);
</script>

<div class="flex justify-between" data-testid="filter-component">
  {#if !data}
    <ProgressRadial width="w-10" value={undefined} />
  {:else}
    {#if data?.type === 'Categorical'}
      <div data-testid="categoical-filter" class="w-full">
        <!-- {await response} -->
        <OptionsSelectionList
          bind:unselectedOptions
          bind:selectedOptions
          bind:currentlyLoading={loading}
          on:scroll={(event) => getNextValues(event.detail.search)}
        />
      </div>
    {:else if data?.type === 'Continuous'}
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
      disabled={data.type === 'Categorical' && valuesSelected.length === 0}
    >
      <i class="fas fa-plus"></i>
    </button>
  {/if}
</div>

<style>
  .btn {
    height: fit-content;
  }
</style>
