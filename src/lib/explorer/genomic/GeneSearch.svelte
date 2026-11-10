<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';

  import HelpInfoPopup from '#lib/ui/popover/HelpInfoPopup.svelte';
  import Panel from '#lib/explorer/components/Panel.svelte';
  import Genes from '#lib/explorer/genomic/gene/Genes.svelte';
  import Frequency from '#lib/explorer/genomic/gene/Frequency.svelte';
  import Consequence from '#lib/explorer/genomic/gene/Consequence.svelte';
  import Summary from '#lib/explorer/genomic/gene/Summary.svelte';

  import { selectedGenes, clearGeneFilters } from '#lib/query/GeneFilter.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let { class: className = '' }: { class: string } = $props();

  function clearSelectedGenes() {
    log(createLog('ACTION', 'genomic.clear_genes'));
    selectedGenes.set([]);
  }

  const helpText = $derived(config.branding.help.popups.genomicFilter);
</script>

<div id="genomic-gene-search" class="grid grid-cols-3 gap-3 {className || ''}">
  <Panel
    data-testid="genomic-gene-panel"
    title="Search for Gene with Variant"
    subtitle="Use the official gene symbol."
    required
  >
    {#snippet action()}
      <button
        data-testid="genomic-gene-clear-selected"
        class="btn btn-xs preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500"
        onclick={clearSelectedGenes}>Clear</button
      >
    {/snippet}
    <Genes />
  </Panel>
  <Panel
    data-testid="genomic-consequence-panel"
    title="Select Calculated Consequence"
    subtitle="The calculated consequence is based on VEP annotation."
  >
    {#snippet help()}
      <span
        role="button"
        tabindex="-1"
        onclick={() => log(createLog('ACTION', 'genomic.help_click', { section: 'consequence' }))}
        onkeydown={(e) =>
          e.key === 'Enter' &&
          log(createLog('ACTION', 'genomic.help_click', { section: 'consequence' }))}
      >
        <HelpInfoPopup data-testid="genomic-consequence-help" text={helpText.consequence} />
      </span>
    {/snippet}
    <Consequence />
  </Panel>
  <Panel data-testid="genomic-frequency-panel" title="Select Variant Frequency">
    {#snippet help()}
      <span
        role="button"
        tabindex="-1"
        onclick={() => log(createLog('ACTION', 'genomic.help_click', { section: 'frequency' }))}
        onkeydown={(e) =>
          e.key === 'Enter' &&
          log(createLog('ACTION', 'genomic.help_click', { section: 'frequency' }))}
      >
        <HelpInfoPopup data-testid="genomic-frequency-help" text={helpText.frequency} />
      </span>
    {/snippet}
    <Frequency />
  </Panel>
  <Panel data-testid="genomic-summary-panel" title="Summary of Selected Filters" class="col-span-3">
    {#snippet action()}
      <button
        data-testid="genomic-gene-clear-filters"
        class="btn btn-xs preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500"
        onclick={clearGeneFilters}>Clear</button
      >
    {/snippet}
    <Summary />
  </Panel>
</div>
