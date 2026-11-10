<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { Genotype, type SNP } from '#lib/query/genomic.ts';

  interface Props {
    snp: SNP;
    onsave?: (snp: SNP) => void;
  }

  let { snp, onsave = () => {} }: Props = $props();

  // Edited locally, and reset whenever another SNP is opened.
  let constraint: string = $derived(snp.constraint);
</script>

<span class="mr-4">{snp.search}</span>
<select class="w-96" data-testid="genomic-snp-constraint" required bind:value={constraint}>
  <option selected disabled value>Select Genotype</option>
  <option value={Genotype.Heterozygous}>Heterozygous</option>
  <option value={Genotype.Homozygous}>Homozygous</option>
  <option value={Genotype.HeterozygousOrHomozygous}>Heterozygous or homozygous</option>
  <!-- <option value={Genotype.Neither}>Exclude variant</option> -->
</select>
<Button
  size="sm"
  class="disabled:opacity-75"
  aria-label="Save SNP"
  data-testid="genomic-snp-save"
  onclick={() => onsave({ search: snp.search, constraint })}
  disabled={constraint === ''}
>
  Save SNP
</Button>
