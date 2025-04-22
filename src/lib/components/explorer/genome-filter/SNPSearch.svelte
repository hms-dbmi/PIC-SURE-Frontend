<script lang="ts">
  import { selectedSNPs, clearSnpFilters, saveSNP, deleteSNP } from '$lib/stores/SNPFilter';
  import type { SNP } from '$lib/models/GenomeFilter';

  import Panel from '$lib/components/explorer/Panel.svelte';
  import Search from '$lib/components/explorer/genome-filter/SNP/Search.svelte';
  import Edit from '$lib/components/explorer/genome-filter/SNP/Edit.svelte';
  import Summary from '$lib/components/explorer/genome-filter/SNP/Summary.svelte';

  let { class: className = '' }: { class: string } = $props();

  const defaultSnp: SNP = { search: '', constraint: '' };
  let snp: SNP = $state(defaultSnp);

  function onValid(snpItem: SNP) {
    snp = snpItem;
  }

  function onSave(snpItem: SNP) {
    saveSNP(snpItem);
    snp = defaultSnp;
  }

  function onEdit(snpItem: SNP) {
    snp = snpItem;
  }

  function onDelete(snpItem: SNP) {
    deleteSNP(snpItem);
  }
</script>

<div id="snp-search" class="grid grid-col-1 gap-3 {className}">
  <Panel title="Search for Genomic Variants">
    <Search disabled={snp.search} search={snp.search} onvalid={onValid} />
    {#if snp.search}
      <hr />
      <div class="flex gap-2 items-center justify-center my-8">
        <Edit {snp} onsave={onSave} />
      </div>
    {/if}
  </Panel>
  <Panel title="Summary of Selected Filters">
    {#snippet action()}
      <button
        class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
        disabled={$selectedSNPs.length === 0}
        onclick={clearSnpFilters}>Clear</button
      >
    {/snippet}
    <Summary onedit={onEdit} ondelete={onDelete} />
  </Panel>
</div>
