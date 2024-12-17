<script lang="ts">
  import { branding } from '$lib/configuration';

  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import Panel from '$lib/components/explorer/Panel.svelte';
  import Genes from '$lib/components/explorer/genome-filter/gene/Genes.svelte';
  import Frequency from '$lib/components/explorer/genome-filter/gene/Frequency.svelte';
  import Consequence from '$lib/components/explorer/genome-filter/gene/Consequence.svelte';
  import Summary from '$lib/components/explorer/genome-filter/gene/Summary.svelte';

  import { selectedGenes, clearGeneFilters } from '$lib/stores/GeneFilter';
  interface Props {
    [key: string]: any
  }

  let { ...props }: Props = $props();

  function clearSelectedGenes() {
    selectedGenes.set([]);
  }

  const helpText = branding?.help?.popups?.genomicFilter;
</script>

<div id="gene-search" class="grid grid-col-3 gap-3 {props.class || ''}">
  <Panel
    title="Search for Gene with Variant"
    subtitle="Use the official gene symbol."
    required={true}
  >
    {#snippet action()}
      
        <button
          data-testid="clear-selected-genes-btn"
          class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
          onclick={clearSelectedGenes}>Clear</button
        >
      
      {/snippet}
    <Genes />
  </Panel>
  <Panel
    title="Select Calculated Consequence"
    subtitle="The calculated consequence is based on VEP annotation."
  >
    {#snippet help()}
      
        <HelpInfoPopup id="cons-help-popup" text={helpText.consequence} />
      
      {/snippet}
    <Consequence />
  </Panel>
  <Panel title="Select Variant Frequency">
    {#snippet help()}
      
        <HelpInfoPopup id="freq-help-popup" text={helpText.frequency} />
      
      {/snippet}
    <Frequency />
  </Panel>
  <Panel title="Summary of Selected Filters" class="col-span-3">
    {#snippet action()}
      
        <button
          data-testid="clear-gene-filters-btn"
          class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary"
          onclick={clearGeneFilters}>Clear</button
        >
      
      {/snippet}
    <Summary />
  </Panel>
</div>
