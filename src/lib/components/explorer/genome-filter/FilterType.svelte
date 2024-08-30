<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Option } from '$lib/models/GenomeFilter';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

  export let active: Option = Option.None;

  const dispatch = createEventDispatcher<{ select: { option: Option } }>();
</script>

<div class="flex flex-row justify-center justify-items-center gap-16 {$$props.class ?? ''}">
  <CardButton
    data-testid="gene-variant-option"
    title="Variants by gene name"
    subtitle="Ex: Rare BRCA1 variants with high severity"
    size="other"
    class="w-1/4 h-20 min-h-20 variant-ringed-primary"
    active={active === Option.Genomic}
    on:click={() => dispatch('select', { option: Option.Genomic })}
  />
  <CardButton
    data-testid="snp-option"
    title="Specific SNPs"
    subtitle="Ex: chr17,35269878,G,A"
    size="other"
    class="w-1/4 h-20 min-h-20 variant-ringed-primary"
    active={active === Option.SNP}
    on:click={() => dispatch('select', { option: Option.SNP })}
  />
</div>
