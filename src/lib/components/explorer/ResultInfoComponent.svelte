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
      <ProgressRadial />
    {:then searchResultDetail } 
      <section class="flex flex-col w-3/4 p-4">
        <h3 class="text-primary-500">Variable Information</h3>
        <div class="w-full flex flex-row justify-between">
          <div><span class="font-bold">Name:</span> {searchResultDetail.display}</div>
          <div><span class="font-bold mb-1">Accession:</span> {searchResultDetail.name}</div>
          <div><span class="font-bold mb-1">Type:</span> {searchResultDetail.type}</div>
        </div>
        <div><span class="font-bold">Description:</span> {searchResultDetail.description}</div>
      </section>
      {#if searchResultDetail.table}
      <section class="flex flex-col w-3/4 p-4">
        <h3 class="text-primary-500">Dataset Information</h3>
        <div class="w-full flex flex-row justify-between">
          <div><span class="font-bold mb-1">Name:</span> {searchResultDetail.display}</div>
          <div><span class="font-bold">Accession:</span> {searchResultDetail.name}</div>
        </div>
        <div><span class="font-bold">Description:</span> {searchResultDetail.description}</div>
      </section>
      {/if}
      {#if searchResultDetail.study}
      <section class="flex flex-col w-3/4 p-4">
        <h3 class="text-primary-500">Study Information</h3>
        <div class="w-full flex flex-col">
          <div><span class="font-bold mb-1">Study Name:</span> {searchResultDetail.display}</div>
          <div><span class="font-bold">Study Accession:</span> {searchResultDetail.name}</div>
        </div>
      </section>
      {/if}
    {/await}
  </div>
</div>

