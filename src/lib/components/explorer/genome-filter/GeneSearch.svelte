<script lang="ts">
  import { branding } from '$lib/configuration';

  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import Panel from '$lib/components/explorer/Panel.svelte';
  import Genes from '$lib/components/explorer/genome-filter/gene/Genes.svelte';
  import Frequency from '$lib/components/explorer/genome-filter/gene/Frequency.svelte';
  import Consequence from '$lib/components/explorer/genome-filter/gene/Consequence.svelte';
  import Summary from '$lib/components/explorer/genome-filter/gene/Summary.svelte';

  import { selectedGenes, clearGeneFilters } from '$lib/stores/GeneFilter';

  function clearSelectedGenes() {
    selectedGenes.set([]);
  }

  const helpText = branding?.help?.popups?.genomicFilter;
</script>

<div id="gene-search" class="grid grid-col-3 gap-3 {$$props.class || ''}">
  <Panel
    title="Search for Gene with Variant"
    subtitle="Use the official gene symbol."
    required={true}
  >
    <svelte:fragment slot="action">
      <button
        data-testid="clear-selected-genes-btn"
        class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
        on:click={clearSelectedGenes}>Clear</button
      >
    </svelte:fragment>
    <Genes />
  </Panel>
  <Panel
    title="Select Calculated Consequence"
    subtitle="The calculated consequence is based on VEP annotation."
  >
    <svelte:fragment slot="help">
      <HelpInfoPopup id="cons-help-popup" text={helpText.consequence} />
    </svelte:fragment>
    <Consequence />
  </Panel>
  <Panel title="Select Variant Frequency">
    <svelte:fragment slot="help">
      <HelpInfoPopup id="freq-help-popup" text={helpText.frequency} />
    </svelte:fragment>
    <Frequency />
  </Panel>
  <Panel title="Summary of Selected Filters" class="col-span-3">
    <svelte:fragment slot="action">
      <button
        data-testid="clear-gene-filters-btn"
        class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
        on:click={clearGeneFilters}>Clear</button
      >
    </svelte:fragment>
    <Summary />
  </Panel>
</div>
