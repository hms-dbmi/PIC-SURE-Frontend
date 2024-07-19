<script lang="ts">
  import { selectedSNPs, clearSnpFilters, saveSNP, deleteSNP } from '$lib/stores/SNPFilter';
  import type { SNP } from '$lib/models/GemoneFilter';

  import Panel from '$lib/components/explorer/Panel.svelte';
  import Search from '$lib/components/explorer/gemone-filter/SNP/Search.svelte';
  import Edit from '$lib/components/explorer/gemone-filter/SNP/Edit.svelte';
  import Summary from '$lib/components/explorer/gemone-filter/SNP/Summary.svelte';

  type SNPEvent = { detail: { snp: SNP } };
  let snp: SNP = { search: '', constraint: '' };

  function onValid(e: SNPEvent) {
    snp = e.detail.snp;
  }

  function onSave(e: SNPEvent) {
    saveSNP(e.detail.snp);
    snp = { search: '', constraint: '' };
  }

  function onEdit(e: SNPEvent) {
    snp = e.detail.snp;
  }

  function onDelete(e: SNPEvent) {
    deleteSNP(e.detail.snp);
  }
</script>

<div class="grid grid-col-1 gap-3 {$$props.class || ''}">
  <Panel title="Search for Genomic Variants using rsIDs">
    <Search disabled={snp.search} search={snp.search} on:valid={onValid} />
    {#if snp.search}
      <hr />
      <div class="flex gap-2 items-center justify-center my-8">
        <Edit {snp} on:save={onSave} />
      </div>
    {/if}
  </Panel>
  <Panel title="Summary of Selected Filters">
    <svelte:fragment slot="action">
      <button
        class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
        disabled={$selectedSNPs.length === 0}
        on:click={clearSnpFilters}>Clear</button
      >
    </svelte:fragment>
    <Summary on:edit={onEdit} on:delete={onDelete} />
  </Panel>
</div>
