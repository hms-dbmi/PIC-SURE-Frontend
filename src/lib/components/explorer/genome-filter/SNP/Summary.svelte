<script lang="ts">
  import { GenotypeMap, type SNP } from '$lib/models/GenomeFilter';
  import { selectedSNPs } from '$lib/stores/SNPFilter';

  const {
    onedit = () => {},
    ondelete = () => {},
  }: {
    onedit?: (snp: SNP) => void;
    ondelete?: (snp: SNP) => void;
  } = $props();
</script>

<div class="flex items-center justify-center">
  {#if $selectedSNPs.length === 0}
    <p>No filters added.</p>
  {/if}
  {#each $selectedSNPs as snp, index}
    {#if index !== 0}
      <div class="font-bold flex items-center justify-center p-6">AND</div>
    {/if}
    <div class="border rounded-sm border-surface-300-700 p-3 flex gap-4">
      <div class="flex-auto">
        <div class="text-surface-700-300 font-bold">{snp.search}:</div>
        <div class="text-surface-600-400">{GenotypeMap[snp.constraint]}</div>
      </div>
      <div class="flex-none text-right">
        <button
          type="button"
          data-testid={`snp-edit-btn-${snp.search}`}
          title="Edit"
          aria-label="Edit"
          class="btn-icon-color"
          onclick={() => onedit(snp)}
        >
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button
          type="button"
          data-testid={`snp-delete-btn-${snp.search}`}
          title="Delete"
          aria-label="Delete"
          class="btn-icon-color"
          onclick={() => ondelete(snp)}
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  {/each}
</div>
