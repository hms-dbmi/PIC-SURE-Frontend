<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { GenotypeMap, type SNP } from '$lib/models/GenomeFilter';
  import { selectedSNPs } from '$lib/stores/SNPFilter';

  const dispatch = createEventDispatcher<{ edit: { snp: SNP }; delete: { snp: SNP } }>();
</script>

<div class="flex items-center justify-center">
  {#if $selectedSNPs.length === 0}
    <p>No filters added.</p>
  {/if}
  {#each $selectedSNPs as snp, index}
    {#if index !== 0}
      <div class="font-bold flex items-center justify-center p-6">AND</div>
    {/if}
    <div class="border rounded border-surface-300-600-token p-3 flex gap-4">
      <div class="flex-auto">
        <div class="text-surface-600-300-token font-bold">{snp.search}:</div>
        <div class="text-surface-500-400-token">{GenotypeMap[snp.constraint]}</div>
      </div>
      <div class="flex-none text-right">
        <button
          type="button"
          data-testid={`snp-edit-btn-${snp.search}`}
          title="Edit"
          class="btn-icon-color"
          onclick={() => dispatch('edit', { snp })}
        >
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button
          type="button"
          data-testid={`snp-delete-btn-${snp.search}`}
          title="Delete"
          class="btn-icon-color"
          onclick={() => dispatch('delete', { snp })}
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  {/each}
</div>
