<script lang="ts">
  import {
    selectedSNPs,
    clearSnpFilters,
    saveSNP,
    deleteSNP,
    snpDraftRevision,
  } from '$lib/stores/SNPFilter';
  import type { SNP } from '$lib/models/GenomeFilter';

  import Panel from '$lib/components/explorer/Panel.svelte';
  import Search from '$lib/components/explorer/genome-filter/SNP/Search.svelte';
  import Edit from '$lib/components/explorer/genome-filter/SNP/Edit.svelte';
  import Summary from '$lib/components/explorer/genome-filter/SNP/Summary.svelte';

  let { class: className = '' }: { class: string } = $props();

  const defaultSnp = (): SNP => ({ search: '', constraint: '' });
  let snp: SNP = $state(defaultSnp());

  // The variant in the editor is held here, where nothing outside this component can see it -
  // so when the selection behind it is replaced wholesale, it has to be dropped from here.
  // Otherwise a variant left half-constrained could be saved into the draft that replaced it,
  // and the chip's edit control is where that happens: it leads to the route the user is
  // already on, so nothing is remounted and the editor would simply stay as it was. The
  // search box below keys off the same signal, being a child that reads its value once.
  // `pre`, so the reset lands before the DOM is rebuilt: the search box below is keyed on the
  // same signal, and a remount that happened first would seed the new box from the variant
  // being dropped.
  $effect.pre(() => {
    void $snpDraftRevision;
    snp = defaultSnp();
  });

  function onvalid(snpItem: SNP) {
    snp = snpItem;
  }

  function onsave(snpItem: SNP) {
    saveSNP(snpItem);
    snp = defaultSnp();
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
    {#key $snpDraftRevision}
      <Search disabled={!!snp.search} search={snp.search} {onvalid} />
    {/key}
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
