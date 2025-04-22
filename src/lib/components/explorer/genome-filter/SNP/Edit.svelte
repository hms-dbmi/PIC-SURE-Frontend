<script lang="ts">
  import { Genotype, type SNP } from '$lib/models/GenomeFilter';

  let { snp, onsave = () => {} }: { snp: SNP; onsave: (snp: SNP) => void } = $props();

  let constraint: string = $state(snp.constraint);
</script>

<span class="mr-4">{snp.search}</span>
<select class="select w-96" data-testid="snp-constraint" required bind:value={constraint}>
  <option selected disabled value>Select Genotype</option>
  <option value={Genotype.Heterozygous}>Heterozygous</option>
  <option value={Genotype.Homozygous}>Homozygous</option>
  <option value={Genotype.HeterozygousOrHomozygous}>Heterozygous or homozygous</option>
  <option value={Genotype.Neither}>Exclude variant</option>
</select>
<button
  type="button"
  aria-label="Save SNP"
  data-testid="snp-save-btn"
  class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75"
  onclick={() => onsave({ search: snp.search, constraint })}
  disabled={constraint === ''}
>
  Save SNP
</button>
