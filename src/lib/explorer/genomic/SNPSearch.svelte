<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';
  import type { SNP } from '#lib/query/genomic.ts';

  import Panel from '#lib/explorer/components/Panel.svelte';
  import Search from '#lib/explorer/genomic/SNP/Search.svelte';
  import Edit from '#lib/explorer/genomic/SNP/Edit.svelte';
  import Summary from '#lib/explorer/genomic/SNP/Summary.svelte';

  let { class: className = '' }: { class: string } = $props();

  const defaultSnp: SNP = { search: '', constraint: '' };
  let snp: SNP = $state(defaultSnp);

  function onvalid(snpItem: SNP) {
    snp = snpItem;
  }

  function onsave(snpItem: SNP) {
    genomicDraft.saveSnp(snpItem);
    snp = defaultSnp;
  }

  function onedit(snpItem: SNP) {
    snp = snpItem;
  }

  function ondelete(snpItem: SNP) {
    genomicDraft.deleteSnp(snpItem);
  }
</script>

<div id="genomic-snp-search" class="grid grid-cols-1 gap-3 {className || ''}">
  <Panel data-testid="genomic-snp-panel" title="Search for Genomic Variants">
    <Search disabled={!!snp.search} search={snp.search} {onvalid} />
    {#if snp.search}
      <hr />
      <div class="flex gap-2 items-center justify-center my-8">
        <Edit {snp} {onsave} />
      </div>
    {/if}
  </Panel>
  <Panel data-testid="genomic-summary-panel" title="Summary of Selected Filters">
    {#snippet action()}
      <Button
        variant="outlined-surface"
        size="xs"
        disabled={genomicDraft.snps.length === 0}
        onclick={() => genomicDraft.clearSnps()}>Clear</Button
      >
    {/snippet}
    <Summary {onedit} {ondelete} />
  </Panel>
</div>
