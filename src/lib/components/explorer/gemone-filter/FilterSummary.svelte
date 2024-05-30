<script lang="ts">
  export let genes: string[] = [];
  export let frequency: string[] = [];
  export let consequences: string[] = [];
</script>

<div class="overflow-auto h-60 max-h-60">
  <div class="border rounded border-surface-400-500-token p-2">
    <span class="h5 pb-8">Gene with variant: </span>
    <div id="selected-variant" class="ml-3">
      {#each genes as gene, index}
        {#if index !== 0}
          <span class="font-bold mx-1">OR</span>
        {/if}
        {gene}
      {/each}
    </div>
  </div>
  <div class="ml-2 font-bold">AND</div>
  <div class="border rounded border-surface-400-500-token p-2">
    <span class="h5 pb-8">Variant frequency: </span>
    <div id="selected-frequency" class="ml-3">
      {#each frequency as freq, index}
        {#if index !== 0}
          <span class="font-bold mx-1">OR</span>
        {/if}
        {freq}
      {/each}
    </div>
  </div>
  <div class="ml-2 font-bold">AND</div>
  <div class="border rounded border-surface-400-500-token p-2">
    <span class="h5 pb-8">Consequence Group by severity:</span>
    <div id="selected-consequence" class="ml-3">
      {#each consequences as cons, index}
        {#if index !== 0}
          <span class="font-bold mx-1">OR</span>
        {/if}
        {cons}
      {/each}
    </div>
  </div>
</div>
