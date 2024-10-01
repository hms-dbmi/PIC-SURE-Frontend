<script lang="ts">
  import { features } from '$lib/configuration';
  import { createEventDispatcher } from 'svelte';
  import { Option } from '$lib/models/GenomeFilter';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

  export let active: Option = Option.None;

  const dispatch = createEventDispatcher<{ select: { option: Option } }>();
</script>

<div class="flex flex-row justify-center justify-items-center gap-16 {$$props.class ?? ''}">
  {#if features.enableGENEQuery}
    <CardButton
      data-testid="gene-variant-option"
      title="Variants by gene name"
      subtitle="Ex: Rare BRCA1 variants with high severity"
      size="other"
      class="w-1/4 h-20 min-h-20 variant-ringed-primary"
      active={active === Option.Genomic}
      on:click={() => dispatch('select', { option: Option.Genomic })}
    />
  {/if}
  {#if features.enableSNPQuery}
    <CardButton
      data-testid="snp-option"
      title="Specific SNPs"
      subtitle="Ex: chr17,35269878,G,A"
      size="other"
      class="w-1/4 h-20 min-h-20 variant-ringed-primary"
      active={active === Option.SNP}
      on:click={() => dispatch('select', { option: Option.SNP })}
    />
  {/if}
  {#if !features.enableGENEQuery && !features.enableSNPQuery}
    Genomic filtering has not been enabled in this environment. :(
  {/if}
</div>
