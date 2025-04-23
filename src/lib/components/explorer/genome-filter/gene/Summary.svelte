<script lang="ts">
  import { selectedGenes, selectedFrequency, consequences } from '$lib/stores/GeneFilter';
</script>

<div class="overflow-auto flex">
  <div
    class="border rounded-sm border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2"
  >
    <span class="font-bold">Geneomic Region: </span>
    <div id="selected-variant" class="text-center break-words">
      {#each $selectedGenes as gene, index}
        {#if index !== 0}
          <span class="font-bold mx-1 text-primary-400-500-token">OR</span>
        {/if}
        {gene}
      {/each}
      {#if $selectedGenes.length === 0}
        <span class="italic">None</span>
      {/if}
    </div>
  </div>
  <div class="font-bold flex items-center justify-center w-1/15">AND</div>
  <div
    class="border rounded-sm border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2"
  >
    <span class="font-bold">Calculated Consequence:</span>
    <div id="selected-consequence" class="text-center break-words">
      {#each $consequences as cons, index}
        {#if index !== 0}
          <span class="font-bold mx-1 text-primary-400-500-token">OR</span>
        {/if}
        {cons}
      {/each}
      {#if $consequences.length === 0}
        <span class="italic">None</span>
      {/if}
    </div>
  </div>
  <div class="font-bold flex items-center justify-center w-1/15">AND</div>
  <div
    class="border rounded-sm border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2"
  >
    <span class="font-bold">Variant Frequency: </span>
    <div id="selected-frequency" class="text-center break-words">
      {#each $selectedFrequency as freq, index}
        {#if index !== 0}
          <span class="font-bold mx-1 text-primary-400-500-token">OR</span>
        {/if}
        {freq}
      {/each}
      {#if $selectedFrequency.length === 0}
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
