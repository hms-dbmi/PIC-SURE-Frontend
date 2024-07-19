<script lang="ts">
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import Panel from '$lib/components/explorer/Panel.svelte';
  import Genes from '$lib/components/explorer/gemone-filter/gene/Genes.svelte';
  import Frequency from '$lib/components/explorer/gemone-filter/gene/Frequency.svelte';
  import Consequence from '$lib/components/explorer/gemone-filter/gene/Consequence.svelte';
  import Summary from '$lib/components/explorer/gemone-filter/gene/Summary.svelte';

  import { VariantKeys } from '$lib/models/InfoColumns';
  import { selectedGenes, clearGeneFilters } from '$lib/stores/GeneFilter';
  import { getInfoColumn } from '$lib/stores/InfoColumns';

  function clearSelectedGenes() {
    selectedGenes.set([]);
  }
</script>

<div class="grid grid-col-3 gap-3 {$$props.class || ''}">
  <Panel
    title="Search for Gene with Variant"
    subtitle="Use the official gene symbol."
    required={true}
    class="h-full"
  >
    <svelte:fragment slot="action">
      <button
        class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
        on:click={clearSelectedGenes}>Clear</button
      >
    </svelte:fragment>
    <Genes />
  </Panel>
  <Panel
    title="Select Calculated Consequence"
    subtitle="The calculated consequence is based on VEP annotation."
    class="h-full"
  >
    <svelte:fragment slot="help">
      {#if getInfoColumn(VariantKeys.consequence) && getInfoColumn(VariantKeys.severity)}
        <HelpInfoPopup
          id="cons-help-popup"
          text={getInfoColumn(VariantKeys.consequence) +
            ' Severity: ' +
            getInfoColumn(VariantKeys.severity)}
        />
      {/if}
    </svelte:fragment>
    <Consequence />
  </Panel>
  <Panel title="Select Variant Frequency" class="h-full">
    <svelte:fragment slot="help">
      <HelpInfoPopup id="freq-help-popup" text={getInfoColumn(VariantKeys.frequency)} />
    </svelte:fragment>
    <Frequency />
  </Panel>
  <Panel title="Summary of Selected Filters" class="col-span-3">
    <svelte:fragment slot="action">
      <button
        class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
        on:click={clearGeneFilters}>Clear</button
      >
    </svelte:fragment>
    <Summary />
  </Panel>
</div>
