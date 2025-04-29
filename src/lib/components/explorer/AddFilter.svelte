<script lang="ts">
  import { onMount } from 'svelte';

  import { toaster } from '$lib/toaster';
  import type { SearchResult } from '$lib/models/Search';
  import { addFilter } from '$lib/stores/Filter';
  import { activeRow } from '$lib/stores/ExpandableRow';
  import type { Filter } from '$lib/models/Filter';
  import {
    createCategoricalFilter,
    createNumericFilter,
    createRequiredFilter,
  } from '$lib/models/Filter';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { panelOpen } from '$lib/stores/SidePanel';

  import Loading from '../Loading.svelte';
  import OptionsSelectionList from '../OptionsSelectionList.svelte';

  interface Props {
    data?: SearchResult;
    existingFilter?: Filter;
    onclose?: () => void;
  }

  let { data = {} as SearchResult, existingFilter, onclose = () => {} }: Props = $props();

  let max: string = $state('');
  let min: string = $state('');
  let minFormValue: string = $state('');
  let maxFormValue: string = $state('');
  let pageSize = 20;
  let unselectedOptions: string[] = $state([]);
  let selectedOptions: string[] = $state([]);
  let startLocation = pageSize;
  let lastSearchTerm = '';
  let loading = $state(false);
  let display: string = $state('');
  let description: string = $state('');
  let studyDisplay: string = $state('');

  onMount(async () => {
    if (existingFilter) {
      display = data?.display || '';
      description = data?.description || '';
      studyDisplay =
        data.studyAcronym && data.dataset
          ? `${data.studyAcronym} (${data.dataset})`
          : data.studyAcronym || data.dataset || '';
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
        if (unselectedOptions.length >= 50) {
          unselectedOptions = unselectedOptions.slice(0, pageSize);
        }
      } else if (existingFilter.filterType === 'numeric') {
        minFormValue =
          existingFilter.min !== undefined && existingFilter.min !== null
            ? existingFilter.min.toString()
            : '';
        maxFormValue =
          existingFilter.max !== undefined && existingFilter.max !== null
            ? existingFilter.max.toString()
            : '';
      }
    } else if (data?.type === 'Categorical') {
      try {
        loading = true;
        data = await getConceptDetails(data.conceptPath, data.dataset);
        loading = false;
        unselectedOptions = data?.values || [];
        if (unselectedOptions.length >= 50) {
          unselectedOptions = unselectedOptions.slice(0, pageSize);
        }
      } catch (e) {
        console.error(e);
        toaster.error({
          title: 'An error occured while loading the filter. Please try again later.',
        });
      }
    }
    min = data.min !== undefined && data.min !== null ? data.min.toString() : '';
    max = data.max !== undefined && data.max !== null ? data.max.toString() : '';
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
      filter = createNumericFilter(data, minFormValue || undefined, maxFormValue || undefined);
    }
    if (!filter) return; //todo errors
    addFilter(filter);
    finish();
  }

  function finish() {
    $activeRow = '';
    $panelOpen = true;
    onclose();
  }

  function getNextValues(search: string = '') {
    const totalOptions = data?.values?.length || 0;
    if (totalOptions === 0) return;

    loading = true;
    try {
      let allOptions = data?.values || [];

      if (search !== lastSearchTerm || !lastSearchTerm.includes(search)) {
        // new search
        startLocation = 0;
        unselectedOptions = [];
        lastSearchTerm = search;
      }

      let filteredOptions = allOptions.filter(
        (option) =>
          !selectedOptions.includes(option) &&
          (!search || option.toLowerCase().includes(search.toLowerCase())),
      );

      const endLocation = Math.min(startLocation + pageSize, filteredOptions.length);
      const nextOptions = filteredOptions.slice(startLocation, endLocation);

      unselectedOptions = [...unselectedOptions, ...nextOptions];
      startLocation = endLocation;
    } catch (error) {
      console.error(error);
      toaster.error({
        title: 'An error occurred while loading more options. Please try again later.',
      });
    }
    loading = false;
  }

  let valuesSelected = $derived(selectedOptions.map((option) => option));
</script>

<div>
  {#if !!data}
    <div class="variable-info">
      {#if display}
        <div class="variable-name">Variable Name: {display}</div>
      {/if}
      {#if description}
        <div class="variable-desc">Variable Description: {description}</div>
      {/if}
      {#if studyDisplay}
        <div class="variable-study">Study: {studyDisplay}</div>
      {/if}
    </div>
  {/if}
  <div class="flex justify-between" data-testid="filter-component">
    {#if !data}
      <Loading ring size="medium" />
    {:else}
      {#if data?.type === 'Categorical'}
        <div data-testid="categoical-filter" class="w-full">
          <OptionsSelectionList
            bind:unselectedOptions
            bind:selectedOptions
            bind:currentlyLoading={loading}
            allOptions={data?.values}
            onscroll={getNextValues}
          />
        </div>
      {:else if data?.type === 'Continuous'}
        <div class="card bg-surface-100 p-3 m-1 w-full">
          <section class="card-body flex grow gap-4" data-testid="numerical-filter">
            <label class="flex-auto flex-col">
              <span>Min: {min}</span>
              <input
                id="min"
                data-testid="min-input"
                type="text"
                placeholder="Enter value or leave blank for variable min"
                class="input"
                bind:value={minFormValue}
              />
            </label>
            <label class="flex-auto flex-col">
              <span>Max: {max}</span>
              <input
                id="max"
                data-testid="max-input"
                type="text"
                placeholder="Enter value or leave blank for variable max"
                class="input"
                bind:value={maxFormValue}
              />
            </label>
          </section>
        </div>
      {/if}
      <button
        class="btn btn-icon preset-filled-primary-500 m-1"
        data-testid="add-filter"
        aria-label="Add Filter"
        onclick={addNewFilter}
        disabled={data.type === 'Categorical' && valuesSelected.length === 0}
      >
        <i class="fas fa-plus"></i>
      </button>
    {/if}
  </div>
</div>

<style>
  .btn {
    height: fit-content;
  }
</style>
