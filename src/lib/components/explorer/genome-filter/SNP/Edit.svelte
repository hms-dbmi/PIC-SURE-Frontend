<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Genotype, type SNP } from '$lib/models/GenomeFilter';

  interface Props {
    snp: SNP;
  }

  let { snp }: Props = $props();

  const dispatch = createEventDispatcher<{ save: { snp: SNP } }>();
  let constraint: string = $state(snp.constraint);

  function save() {
    dispatch('save', { snp: { search: snp.search, constraint } });
  }
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
  onclick={save}
  disabled={constraint === ''}
>
  Save SNP
</button>
