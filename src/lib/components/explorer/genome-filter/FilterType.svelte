<script lang="ts">
  import { features } from '$lib/stores/Configuration';
  import { Option } from '$lib/models/GenomeFilter';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

  interface Props {
    active?: Option;
    class?: string;
    onselect?: (option: Option) => void;
  }

  const { active = Option.None, class: className = '', onselect = () => {} }: Props = $props();

  let enableGENEQuery = $derived($features.enableGENEQuery);
  let enableSNPQuery = $derived($features.enableSNPQuery);
</script>

<div class="flex flex-row justify-center justify-items-center gap-16 {className ?? ''}">
  {#if enableGENEQuery}
    <CardButton
      data-testid="gene-variant-option"
      title="Variants by gene name"
      subtitle="Ex: Rare BRCA1 variants with high severity"
      size="other"
      class="w-1/4 h-20 min-h-20"
      active={active === Option.Genomic}
      onclick={() => onselect(Option.Genomic)}
    />
  {/if}
  {#if enableSNPQuery}
    <CardButton
      data-testid="snp-option"
      title="Specific Variants"
      subtitle="Ex: chr5,148481541,T,A"
      size="other"
      class="w-1/4 h-20 min-h-20"
      active={active === Option.SNP}
      onclick={() => onselect(Option.SNP)}
    />
  {/if}
  {#if !enableGENEQuery && !enableSNPQuery}
    Genomic filtering has not been enabled in this environment. :(
  {/if}
</div>
