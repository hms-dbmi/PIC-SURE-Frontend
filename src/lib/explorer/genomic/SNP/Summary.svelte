<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { GenotypeMap, type SNP } from '#lib/query/genomic.ts';
  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';

  const {
    onedit = () => {},
    ondelete = () => {},
  }: {
    onedit?: (snp: SNP) => void;
    ondelete?: (snp: SNP) => void;
  } = $props();
</script>

<div class="flex items-center justify-center">
  {#if genomicDraft.snps.length === 0}
    <p>No filters added.</p>
  {/if}
  {#each genomicDraft.snps as snp, index}
    {#if index !== 0}
      <div class="font-bold flex items-center justify-center p-6">AND</div>
    {/if}
    <div class="border rounded-sm border-surface-300-700 p-3 flex gap-4">
      <div class="flex-auto">
        <div class="text-surface-700-300 font-bold">{snp.search}:</div>
        <div class="text-surface-600-400">{GenotypeMap[snp.constraint]}</div>
      </div>
      <div class="flex-none text-right">
        <IconButton
          icon="fa-solid fa-pen-to-square"
          label="Edit"
          data-testid={`genomic-snp-edit-${snp.search}`}
          onclick={() => onedit(snp)}
        />
        <IconButton
          icon="fa-solid fa-trash"
          label="Delete"
          data-testid={`genomic-snp-delete-${snp.search}`}
          onclick={() => ondelete(snp)}
        />
      </div>
    </div>
  {/each}
</div>
