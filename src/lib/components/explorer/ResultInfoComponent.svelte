<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/services/dictionary';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  export let data: SearchResult;

  let detailPromise = getConceptDetails(data.conceptPath, data.dataset);
</script>

<div class="card min-h-60 p-4">
  <div class="card-body">
    {#await detailPromise}
      <div class="flex justify-center w-full">
        <ProgressRadial />
      </div>
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
            {#if searchResultDetail.study.display || searchResultDetail.study.studyAcronym || searchResultDetail?.studyAcronym}
              <div>
                <span class="font-bold mb-1">Study Name:</span>
                {searchResultDetail.study.display ||
                  searchResultDetail.study.studyAcronym ||
                  searchResultDetail?.studyAcronym}
              </div>
            {/if}
            {#if searchResultDetail.study.name}
              <div>
                <span class="font-bold">Study Accession:</span>
                {searchResultDetail.study.name}
              </div>
            {/if}
          </div>
        </section>
      {/if}
    {/await}
  </div>
</div>
