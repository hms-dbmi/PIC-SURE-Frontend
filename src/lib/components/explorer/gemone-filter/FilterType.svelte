<script lang="ts">
  import { Option } from '$lib/models/GemoneFilter';
  import GeneFilterStore from '$lib/stores/GenomicFilter';
  let { selectedOption } = GeneFilterStore;

  function selectOption(value: Option) {
    return () => selectedOption.set(value);
  }
</script>

<div class="text-center flex space-x-6">
  <button
    data-testid="gene-variant-option"
    class="clock card card-hover p-6 w-2/3"
    class:bg-primary-200-700-token={$selectedOption === Option.Genomic}
    class:shadow-md={$selectedOption === Option.Genomic}
    on:click={selectOption(Option.Genomic)}
  >
    <p class="text-lg font-bold">Search for variants by gene name</p>
    <p class="text-sm">Ex: Rare BRCA1 variants with high consequence severity</p>
  </button>
  <button
    data-testid="snp-option"
    class="clock card card-hover p-6 w-2/3"
    class:bg-primary-200-700-token={$selectedOption === Option.SNP}
    class:shadow-md={$selectedOption === Option.SNP}
    on:click={selectOption(Option.SNP)}
  >
    <p class="text-lg font-bold">Search for a specific SNP</p>
    <p class="text-sm">Ex: chr17,35269878,G,A</p>
  </button>
</div>
