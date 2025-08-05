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

  function onvalid(snpItem: SNP) {
    snp = snpItem;
  }

  function onsave(snpItem: SNP) {
    saveSNP(snpItem);
    snp = defaultSnp;
  }

  function onedit(snpItem: SNP) {
    snp = snpItem;
  }

  function ondelete(snpItem: SNP) {
    deleteSNP(snpItem);
  }
</script>

<div id="snp-search" class="grid grid-cols-1 gap-3 {className || ''}">
  <Panel title="Search for Genomic Variants">
    <Search disabled={!!snp.search} search={snp.search} {onvalid} />
    {#if snp.search}
      <hr />
      <div class="flex gap-2 items-center justify-center my-8">
        <Edit {snp} {onsave} />
      </div>
    {/if}
  </Panel>
  <Panel title="Summary of Selected Filters">
    {#snippet action()}
      <button
        class="btn btn-xs preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500"
        disabled={$selectedSNPs.length === 0}
        onclick={clearSnpFilters}>Clear</button
      >
    {/snippet}
    <Summary {onedit} {ondelete} />
  </Panel>
</div>
