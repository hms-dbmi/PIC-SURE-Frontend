<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { config } from '#lib/config/config.svelte.ts';

  import HelpTip from '#lib/ui/popover/HelpTip.svelte';
  import Panel from '#lib/explorer/components/Panel.svelte';
  import Genes from '#lib/explorer/genomic/gene/Genes.svelte';
  import Frequency from '#lib/explorer/genomic/gene/Frequency.svelte';
  import Consequence from '#lib/explorer/genomic/gene/Consequence.svelte';
  import Summary from '#lib/explorer/genomic/gene/Summary.svelte';

  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let { class: className = '' }: { class: string } = $props();

  function clearSelectedGenes() {
    log(createLog('ACTION', 'genomic.clear_genes'));
    genomicDraft.genes = [];
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
      <Button
        variant="outlined-surface"
        size="xs"
        data-testid="genomic-gene-clear-selected"
        onclick={clearSelectedGenes}>Clear</Button
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
      <HelpTip
        data-testid="genomic-consequence-help"
        text={helpText.consequence}
        onopen={(by) =>
          by === 'click' &&
          log(createLog('ACTION', 'genomic.help_click', { section: 'consequence' }))}
      />
    {/snippet}
    <Consequence />
  </Panel>
  <Panel data-testid="genomic-frequency-panel" title="Select Variant Frequency">
    {#snippet help()}
      <HelpTip
        data-testid="genomic-frequency-help"
        text={helpText.frequency}
        onopen={(by) =>
          by === 'click' &&
          log(createLog('ACTION', 'genomic.help_click', { section: 'frequency' }))}
      />
    {/snippet}
    <Frequency />
  </Panel>
  <Panel data-testid="genomic-summary-panel" title="Summary of Selected Filters" class="col-span-3">
    {#snippet action()}
      <Button
        variant="outlined-surface"
        size="xs"
        data-testid="genomic-gene-clear-filters"
        onclick={() => genomicDraft.clearGenes()}>Clear</Button
      >
    {/snippet}
    <Summary />
  </Panel>
</div>
