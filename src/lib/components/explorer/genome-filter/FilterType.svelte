<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Option } from '$lib/models/GenomeFilter';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

  export let active: Option = Option.None;

  const dispatch = createEventDispatcher<{ select: { option: Option } }>();
</script>

<div class="grid grid-cols-2 place-items-center {$$props.class ?? ''}">
  <CardButton
    data-testid="gene-variant-option"
    title="Search for variants by gene name"
    subtitle="Ex: Rare BRCA1 variants with high consequence severity"
    size="other"
    class="w-2/3 h-32 min-h-32"
    active={active === Option.Genomic}
    on:click={() => dispatch('select', { option: Option.Genomic })}
  />
  <CardButton
    data-testid="snp-option"
    title="Search for a specific SNP"
    subtitle="Ex: chr17,35269878,G,A"
    size="other"
    class="w-2/3 h-32 min-h-32"
    active={active === Option.SNP}
    on:click={() => dispatch('select', { option: Option.SNP })}
  />
</div>
