<script lang="ts">
  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';
</script>

<div class="overflow-auto flex">
  <div
    class="border rounded-sm border-surface-500 flex flex-col items-center justify-center w-3/15 p-2"
  >
    <span class="font-bold">Genomic Region: </span>
    <div id="genomic-summary-variant" class="text-center break-words">
      {#each genomicDraft.genes as gene, index}
        {#if index !== 0}
          <span class="font-bold mx-1 text-primary-500">OR</span>
        {/if}
        {gene}
      {/each}
      {#if genomicDraft.genes.length === 0}
        <span class="italic">None</span>
      {/if}
    </div>
  </div>
  <div class="font-bold flex items-center justify-center w-1/15">AND</div>
  <div
    class="border rounded-sm border-surface-500 flex flex-col items-center justify-center w-3/15 p-2"
  >
    <span class="font-bold">Calculated Consequence:</span>
    <div id="genomic-summary-consequence" class="text-center break-words">
      {#each genomicDraft.consequences as cons, index}
        {#if index !== 0}
          <span class="font-bold mx-1 text-primary-500">OR</span>
        {/if}
        {cons}
      {/each}
      {#if genomicDraft.consequences.length === 0}
        <span class="italic">None</span>
      {/if}
    </div>
  </div>
  <div class="font-bold flex items-center justify-center w-1/15">AND</div>
  <div
    class="border rounded-sm border-surface-500 flex flex-col items-center justify-center w-3/15 p-2"
  >
    <span class="font-bold">Variant Frequency: </span>
    <div id="genomic-summary-frequency" class="text-center break-words">
      {#each genomicDraft.frequency as freq, index}
        {#if index !== 0}
          <span class="font-bold mx-1 text-primary-500">OR</span>
        {/if}
        {freq}
      {/each}
      {#if genomicDraft.frequency.length === 0}
        <span class="italic">None</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .w-1\/15 {
    width: 6.666%;
  }
  .w-3\/15 {
    width: 28.888%;
  }
</style>
