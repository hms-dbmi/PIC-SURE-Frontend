<script lang="ts">
  import { features } from '$lib/configuration';
  import { Option } from '$lib/models/GenomeFilter';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

  interface Props {
    active?: Option;
    class?: string;
    onselect?: (option: Option) => void;
  }

  const { active = Option.None, class: className = '', onselect = () => {} }: Props = $props();
</script>

<div class="flex flex-row justify-center justify-items-center gap-16 {className ?? ''}">
  {#if features.enableGENEQuery}
    <CardButton
      data-testid="gene-variant-option"
      title="Variants by gene name"
      subtitle="Ex: Rare BRCA1 variants with high severity"
      size="other"
      class="w-1/4 h-20 min-h-20 preset-outlined-primary-500"
      active={active === Option.Genomic}
      onclick={() => onselect(Option.Genomic)}
    />
  {/if}
  {#if features.enableSNPQuery}
    <CardButton
      data-testid="snp-option"
      title="Specific SNPs"
      subtitle="Ex: chr5,148481541,T,A"
      size="other"
      class="w-1/4 h-20 min-h-20 preset-outlined-primary-500"
      active={active === Option.SNP}
      onclick={() => onselect(Option.SNP)}
    />
  {/if}
  {#if !features.enableGENEQuery && !features.enableSNPQuery}
    Genomic filtering has not been enabled in this environment. :(
  {/if}
</div>
