<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import Loading from '$lib/components/Loading.svelte';

  let { data = {} as SearchResult }: { data?: SearchResult } = $props();

  let detailPromise = getConceptDetails(data.conceptPath, data.dataset);
</script>

<div class="card bg-surface-100 min-h-60 p-4">
  <div class="card-body">
    {#await detailPromise}
      <Loading ring size="medium" />
    {:then searchResultDetail}
      <section data-testid="variable-info" class="flex flex-col w-3/4 p-4">
        <h3 class="text-primary-500">Variable Information</h3>
        <div class="w-full flex flex-row justify-between">
          {#if searchResultDetail.display}
            <div><span class="font-bold">Name:</span> {searchResultDetail.display}</div>
          {/if}
          {#if searchResultDetail.name}
            <div><span class="font-bold mb-1">Accession:</span> {searchResultDetail.name}</div>
          {/if}
          {#if searchResultDetail.type}
            <div><span class="font-bold mb-1">Type:</span> {searchResultDetail.type}</div>
          {/if}
        </div>
        {#if searchResultDetail.description}
          <div><span class="font-bold">Description:</span> {searchResultDetail.description}</div>
        {/if}
      </section>
      {#if searchResultDetail.table}
        <section data-testid="dataset-info" class="flex flex-col w-3/4 p-4">
          <h3 class="text-primary-500">Dataset Information</h3>
          <div class="w-full flex flex-row justify-between">
            {#if searchResultDetail.table.display}
              <div>
                <span class="font-bold mb-1">Name:</span>
                {searchResultDetail.table.display}
              </div>
            {/if}
            {#if searchResultDetail.table.name}
              <div><span class="font-bold">Accession:</span> {searchResultDetail.table.name}</div>
            {/if}
          </div>
          {#if searchResultDetail.table.description}
            <div>
              <span class="font-bold">Description:</span>
              {searchResultDetail.table.description}
            </div>
          {/if}
        </section>
      {/if}
      {#if searchResultDetail.study}
        <section data-testid="study-info" class="flex flex-col w-3/4 p-4">
          <h3 class="text-primary-500">Study Information</h3>
          <div class="w-full flex flex-col">
            {#if searchResultDetail.study.fullName || searchResultDetail.study.display || searchResultDetail.study.studyAcronym || searchResultDetail?.studyAcronym}
              <div>
                <span class="font-bold mb-1">Study Name:</span>
                {searchResultDetail.study.fullName ||
                  searchResultDetail.study.display ||
                  searchResultDetail.study.studyAcronym ||
                  searchResultDetail?.studyAcronym}
              </div>
            {/if}
            {#if searchResultDetail.study.ref}
              <div>
                <span class="font-bold">Study Accession:</span>
                {searchResultDetail.study.ref}
              </div>
            {/if}
          </div>
        </section>
      {/if}
    {/await}
  </div>
</div>
